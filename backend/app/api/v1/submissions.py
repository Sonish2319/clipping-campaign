from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.core.database import get_db
from app.models.campaign import Campaign, CampaignApplication
from app.models.submission import CampaignSubmission, YouTubeVideo, VideoStatistic
from app.models.user import User
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionReview,
    SubmissionResponse,
)
from app.api.deps import get_current_user, require_role
from app.services.youtube_service import YouTubeService
from app.services.reward_service import RewardService
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/submissions", tags=["Clip Submissions"])


@router.post("/campaigns/{campaign_id}/submit", response_model=SubmissionResponse)
def submit_clip(
    campaign_id: int,
    submission_in: SubmissionCreate,
    current_user: User = Depends(require_role(["editor", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Editor submits a published YouTube clip URL to an approved campaign."""
    if submission_in.campaign_id is None:
        submission_in.campaign_id = campaign_id
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    if camp.status != "active":
        raise HTTPException(status_code=400, detail="Cannot submit clips to inactive or completed campaigns.")

    # Check that editor has an accepted application
    app_record = (
        db.query(CampaignApplication)
        .filter(
            CampaignApplication.campaign_id == campaign_id,
            CampaignApplication.editor_id == current_user.id,
            CampaignApplication.status == "accepted",
        )
        .first()
    )
    if not app_record:
        raise HTTPException(
            status_code=403,
            detail="You must have an accepted application before submitting clips to this campaign.",
        )

    # Validate YouTube URL and extract video ID
    video_id = YouTubeService.extract_video_id(submission_in.youtube_url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL. Please provide a valid video link.")

    # Check for duplicate submission across campaigns
    existing_sub = (
        db.query(CampaignSubmission)
        .filter(CampaignSubmission.youtube_video_id == video_id)
        .first()
    )
    if existing_sub:
        raise HTTPException(
            status_code=400,
            detail="This YouTube video has already been linked to a campaign.",
        )

    # Fetch live video metadata using YouTube Data API v3
    meta = YouTubeService.get_video_metadata(video_id)
    if not meta:
        raise HTTPException(status_code=400, detail="Could not retrieve video metadata from YouTube.")

    if meta.get("privacy_status") != "public":
        raise HTTPException(status_code=400, detail="The submitted YouTube video must be public.")

    # Duration check against campaign rules
    duration = meta.get("duration_seconds", 0)
    if duration > 0:
        if camp.min_clip_duration_sec and duration < camp.min_clip_duration_sec:
            raise HTTPException(
                status_code=400,
                detail=f"Video duration ({duration}s) is shorter than campaign minimum ({camp.min_clip_duration_sec}s).",
            )
        if camp.max_clip_duration_sec and duration > camp.max_clip_duration_sec:
            raise HTTPException(
                status_code=400,
                detail=f"Video duration ({duration}s) exceeds campaign maximum ({camp.max_clip_duration_sec}s).",
            )

    # Initial view baseline
    initial_views = meta.get("view_count", 0)

    # Create submission record
    sub = CampaignSubmission(
        campaign_id=campaign_id,
        application_id=app_record.id,
        editor_id=current_user.id,
        youtube_url=submission_in.youtube_url,
        youtube_video_id=video_id,
        status="pending_creator_review",
        baseline_views=initial_views,
        current_views=initial_views,
        eligible_views=0,
    )
    db.add(sub)
    db.flush()

    # Create YouTubeVideo record
    yt_video = YouTubeVideo(
        submission_id=sub.id,
        video_id=video_id,
        channel_id=meta.get("channel_id", ""),
        channel_title=meta.get("channel_title", ""),
        title=meta.get("title", ""),
        description=meta.get("description", ""),
        thumbnail_url=meta.get("thumbnail_url", ""),
        duration_seconds=duration,
        published_at=meta.get("published_at"),
        privacy_status=meta.get("privacy_status", "public"),
        view_count=initial_views,
        like_count=meta.get("like_count", 0),
        comment_count=meta.get("comment_count", 0),
        last_polled_at=datetime.now(timezone.utc),
    )
    db.add(yt_video)
    db.flush()

    # Create initial statistics snapshot
    stat = VideoStatistic(
        video_id=yt_video.id,
        view_count=initial_views,
        like_count=meta.get("like_count", 0),
        comment_count=meta.get("comment_count", 0),
        view_delta=0,
        like_delta=0,
    )
    db.add(stat)

    db.commit()
    db.refresh(sub)

    # Notify Creator
    NotificationService.create_notification(
        db=db,
        user_id=camp.creator_id,
        title="New Clip Submitted for Review! 🎬",
        message=f"Editor submitted clip '{meta.get('title')}' for '{camp.title}'.",
        event_type="SUBMISSION_SUBMITTED",
        target_url=f"/creator/submissions",
    )

    AuditService.log_audit(
        db=db,
        actor_user_id=current_user.id,
        action="CLIP_SUBMITTED",
        resource_type="submission",
        resource_id=str(sub.id),
        new_state={"video_id": video_id, "title": meta.get("title")},
    )

    return sub


@router.post("/submit", response_model=SubmissionResponse)
def submit_clip_direct(
    submission_in: SubmissionCreate,
    current_user: User = Depends(require_role(["editor", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Direct submission route accepting campaign_id in body."""
    if not submission_in.campaign_id:
        raise HTTPException(status_code=400, detail="campaign_id is required.")
    return submit_clip(
        campaign_id=submission_in.campaign_id,
        submission_in=submission_in,
        current_user=current_user,
        db=db,
    )


@router.get("/top", response_model=List[SubmissionResponse])
def get_top_clips(
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Public endpoint returning top performing video clips ordered by current views."""
    subs = (
        db.query(CampaignSubmission)
        .options(
            joinedload(CampaignSubmission.campaign),
            joinedload(CampaignSubmission.video),
            joinedload(CampaignSubmission.editor),
        )
        .order_by(desc(CampaignSubmission.current_views))
        .limit(limit)
        .all()
    )
    return subs


@router.get("/my", response_model=List[SubmissionResponse])
def get_my_submissions(
    current_user: User = Depends(require_role(["editor", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Returns all clip submissions made by the current editor."""
    subs = (
        db.query(CampaignSubmission)
        .options(
            joinedload(CampaignSubmission.campaign),
            joinedload(CampaignSubmission.video),
        )
        .filter(CampaignSubmission.editor_id == current_user.id)
        .order_by(desc(CampaignSubmission.created_at))
        .all()
    )
    return subs


@router.get("/campaign/{campaign_id}", response_model=List[SubmissionResponse])
def get_campaign_submissions(
    campaign_id: int,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Creator reviews all submissions for their campaign."""
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    if camp.creator_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    subs = (
        db.query(CampaignSubmission)
        .options(
            joinedload(CampaignSubmission.editor),
            joinedload(CampaignSubmission.video),
            joinedload(CampaignSubmission.campaign),
        )
        .filter(CampaignSubmission.campaign_id == campaign_id)
        .order_by(desc(CampaignSubmission.created_at))
        .all()
    )
    return subs


@router.post("/{submission_id}/review", response_model=SubmissionResponse)
def review_submission(
    submission_id: int,
    review_in: SubmissionReview,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Creator approves or rejects a submitted clip."""
    sub = db.query(CampaignSubmission).filter(CampaignSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    camp = sub.campaign
    if camp.creator_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    if review_in.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Review status must be 'approved' or 'rejected'.")

    prev_status = sub.status
    sub.status = review_in.status

    if review_in.status == "approved":
        sub.approved_at = datetime.now(timezone.utc)
        sub.rejection_reason = None
        # Recalculate reward based on current views
        if sub.video:
            RewardService.calculate_and_accrue_reward(db=db, submission=sub, new_views=sub.video.view_count)

        NotificationService.create_notification(
            db=db,
            user_id=sub.editor_id,
            title="Clip Approved! 🚀",
            message=f"Your clip for '{camp.title}' was approved. Views will now generate rewards automatically.",
            event_type="SUBMISSION_APPROVED",
            target_url="/editor/submissions",
        )
    else:
        sub.rejection_reason = review_in.rejection_reason
        NotificationService.create_notification(
            db=db,
            user_id=sub.editor_id,
            title="Clip Rejected",
            message=f"Your clip for '{camp.title}' was rejected: {review_in.rejection_reason or 'Does not meet guidelines.'}",
            event_type="SUBMISSION_REJECTED",
            target_url="/editor/submissions",
        )

    db.commit()
    db.refresh(sub)

    AuditService.log_audit(
        db=db,
        actor_user_id=current_user.id,
        action=f"SUBMISSION_{review_in.status.upper()}",
        resource_type="submission",
        resource_id=str(sub.id),
        previous_state={"status": prev_status},
        new_state={"status": sub.status},
    )

    return sub
