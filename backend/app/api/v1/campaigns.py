import re
from typing import Optional, List
from math import ceil
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.user import User
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignListResponse,
)
from app.api.deps import get_current_user, get_optional_current_user, require_role
from app.services.youtube_service import YouTubeService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


def slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", slug)


@router.get("", response_model=CampaignListResponse)
def list_discover_campaigns(
    search: Optional[str] = Query(None, description="Search in title or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_reward: Optional[float] = Query(None, description="Minimum reward per 1k views"),
    status: Optional[str] = Query("active", description="Campaign status filter"),
    sort_by: Optional[str] = Query("newest", description="newest, most_popular, highest_reward, highest_budget"),
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Public marketplace discovery endpoint (ContentRewards style)."""
    query = db.query(Campaign)

    # For public discovery, show active campaigns unless user is admin or filtering
    if status:
        query = query.filter(Campaign.status == status)
    else:
        query = query.filter(Campaign.status == "active")

    # Search filter
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Campaign.title.ilike(search_fmt),
                Campaign.description.ilike(search_fmt),
                Campaign.category.ilike(search_fmt),
            )
        )

    # Category filter
    if category and category.lower() != "all":
        query = query.filter(Campaign.category == category)

    # Min reward filter
    if min_reward:
        query = query.filter(Campaign.reward_per_1000_views >= min_reward)

    # Sorting
    if sort_by == "highest_reward":
        query = query.order_by(desc(Campaign.reward_per_1000_views))
    elif sort_by == "highest_budget":
        query = query.order_by(desc(Campaign.total_budget))
    elif sort_by == "most_popular":
        query = query.order_by(desc(Campaign.total_views_accumulated))
    else:  # newest
        query = query.order_by(desc(Campaign.created_at))

    total = query.count()
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()

    return CampaignListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=ceil(total / size) if size > 0 else 1,
    )


@router.get("/my", response_model=List[CampaignResponse])
def get_creator_campaigns(
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Returns campaigns owned by the current creator."""
    campaigns = (
        db.query(Campaign)
        .filter(Campaign.creator_id == current_user.id)
        .order_by(desc(Campaign.created_at))
        .all()
    )
    return campaigns


@router.get("/{slug_or_id}", response_model=CampaignResponse)
def get_campaign_details(
    slug_or_id: str,
    db: Session = Depends(get_db),
):
    """Retrieves full campaign information by slug or numeric ID."""
    if slug_or_id.isdigit():
        camp = db.query(Campaign).filter(Campaign.id == int(slug_or_id)).first()
    else:
        camp = db.query(Campaign).filter(Campaign.slug == slug_or_id).first()

    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    return camp


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    campaign_in: CampaignCreate,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Creates a new campaign for the authenticated creator."""
    # Extract YouTube video ID from URL
    video_id = YouTubeService.extract_video_id(campaign_in.original_video_url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid YouTube video URL. Please provide a valid watch, share, or shorts link.",
        )

    # Auto thumbnail if missing
    thumbnail = campaign_in.thumbnail_url or f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

    # Base slug
    base_slug = slugify(campaign_in.title)
    slug = base_slug
    counter = 1
    while db.query(Campaign).filter(Campaign.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    campaign = Campaign(
        creator_id=current_user.id,
        title=campaign_in.title,
        slug=slug,
        description=campaign_in.description,
        original_video_url=campaign_in.original_video_url,
        original_video_id=video_id,
        thumbnail_url=thumbnail,
        category=campaign_in.category,
        target_audience=campaign_in.target_audience,
        reward_per_1000_views=campaign_in.reward_per_1000_views,
        max_reward_per_editor=campaign_in.max_reward_per_editor,
        total_budget=campaign_in.total_budget,
        remaining_budget=campaign_in.total_budget,
        max_editors=campaign_in.max_editors,
        start_date=campaign_in.start_date or datetime.now(timezone.utc),
        end_date=campaign_in.end_date,
        min_clip_duration_sec=campaign_in.min_clip_duration_sec,
        max_clip_duration_sec=campaign_in.max_clip_duration_sec,
        instructions=campaign_in.instructions,
        required_hashtags=campaign_in.required_hashtags,
        required_description_text=campaign_in.required_description_text,
        allowed_rules=campaign_in.allowed_rules,
        disallowed_rules=campaign_in.disallowed_rules,
        status=campaign_in.status or "draft",
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    AuditService.log_audit(
        db=db,
        actor_user_id=current_user.id,
        action="CAMPAIGN_CREATED",
        resource_type="campaign",
        resource_id=str(campaign.id),
        new_state={"title": campaign.title, "status": campaign.status},
    )

    return campaign


@router.patch("/{id}", response_model=CampaignResponse)
def update_campaign(
    id: int,
    campaign_in: CampaignUpdate,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Updates campaign fields (creator can only edit owned campaigns)."""
    camp = db.query(Campaign).filter(Campaign.id == id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    if camp.creator_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this campaign.")

    prev_state = {"title": camp.title, "description": camp.description}
    for field, val in campaign_in.model_dump(exclude_unset=True).items():
        setattr(camp, field, val)

    db.commit()
    db.refresh(camp)

    AuditService.log_audit(
        db=db,
        actor_user_id=current_user.id,
        action="CAMPAIGN_UPDATED",
        resource_type="campaign",
        resource_id=str(camp.id),
        previous_state=prev_state,
        new_state={"title": camp.title},
    )

    return camp


@router.post("/{id}/submit-for-approval")
def submit_for_approval(
    id: int,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Submits draft campaign for administrative review."""
    camp = db.query(Campaign).filter(Campaign.id == id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    if camp.creator_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    camp.status = "pending_approval"
    db.commit()
    return {"message": "Campaign submitted for approval.", "status": camp.status}


@router.post("/{id}/pause")
def pause_campaign(
    id: int,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Pauses an active campaign."""
    camp = db.query(Campaign).filter(Campaign.id == id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    if camp.creator_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    camp.status = "paused"
    db.commit()
    return {"message": "Campaign paused.", "status": camp.status}


@router.post("/{id}/resume")
def resume_campaign(
    id: int,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Resumes a paused campaign."""
    camp = db.query(Campaign).filter(Campaign.id == id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    if camp.creator_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    camp.status = "active"
    db.commit()
    return {"message": "Campaign resumed.", "status": camp.status}
