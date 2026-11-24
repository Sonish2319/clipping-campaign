from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.core.database import get_db
from app.models.campaign import Campaign, CampaignApplication
from app.models.user import User
from app.schemas.submission import (
    ApplicationCreate,
    ApplicationReview,
    ApplicationResponse,
)
from app.api.deps import get_current_user, require_role
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/applications", tags=["Campaign Applications"])


@router.post("/campaigns/{campaign_id}/apply", response_model=ApplicationResponse)
def apply_to_campaign(
    campaign_id: int,
    application_in: ApplicationCreate,
    current_user: User = Depends(require_role(["editor", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Editor applies to an active campaign. Duplicate applications are blocked."""
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    if camp.status != "active":
        raise HTTPException(status_code=400, detail="Applications can only be submitted to active campaigns.")

    # Check for existing application
    existing = (
        db.query(CampaignApplication)
        .filter(
            CampaignApplication.campaign_id == campaign_id,
            CampaignApplication.editor_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You have already applied to this campaign (Status: {existing.status}).",
        )

    # Check max editors limit
    if camp.approved_editors_count >= camp.max_editors:
        raise HTTPException(status_code=400, detail="This campaign has reached its maximum editor capacity.")

    app_record = CampaignApplication(
        campaign_id=campaign_id,
        editor_id=current_user.id,
        pitch_message=application_in.pitch_message,
        proposed_strategy=application_in.proposed_strategy,
        portfolio_url=application_in.portfolio_url,
        status="pending",
    )
    db.add(app_record)
    db.commit()
    db.refresh(app_record)

    # Notify Creator
    NotificationService.create_notification(
        db=db,
        user_id=camp.creator_id,
        title="New Application Received! 📝",
        message=f"{current_user.full_name or 'An editor'} applied to '{camp.title}'.",
        event_type="APPLICATION_RECEIVED",
        target_url=f"/creator/applications",
    )

    AuditService.log_audit(
        db=db,
        actor_user_id=current_user.id,
        action="APPLICATION_SUBMITTED",
        resource_type="application",
        resource_id=str(app_record.id),
        new_state={"campaign_id": camp.id, "editor_id": current_user.id},
    )

    return app_record


@router.get("/my", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(require_role(["editor", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Returns all applications submitted by the current editor."""
    apps = (
        db.query(CampaignApplication)
        .options(joinedload(CampaignApplication.campaign))
        .filter(CampaignApplication.editor_id == current_user.id)
        .order_by(desc(CampaignApplication.created_at))
        .all()
    )
    return apps


@router.get("/campaign/{campaign_id}", response_model=List[ApplicationResponse])
def get_campaign_applications(
    campaign_id: int,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Creator reviews all applications submitted to their campaign."""
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    if camp.creator_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    apps = (
        db.query(CampaignApplication)
        .options(
            joinedload(CampaignApplication.editor),
            joinedload(CampaignApplication.campaign),
        )
        .filter(CampaignApplication.campaign_id == campaign_id)
        .order_by(desc(CampaignApplication.created_at))
        .all()
    )
    return apps


@router.post("/{application_id}/accept", response_model=ApplicationResponse)
@router.post("/{application_id}/accepted", response_model=ApplicationResponse)
def accept_application(
    application_id: int,
    review: Optional[ApplicationReview] = None,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Creator accepts an editor application."""
    app_record = db.query(CampaignApplication).filter(CampaignApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    camp = app_record.campaign
    if camp.creator_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    if app_record.status == "accepted":
        return app_record

    app_record.status = "accepted"
    app_record.review_notes = review.review_notes if review else "Accepted by creator"
    app_record.reviewed_at = datetime.now(timezone.utc)
    camp.approved_editors_count = (camp.approved_editors_count or 0) + 1

    db.commit()
    db.refresh(app_record)

    # Notify Editor
    NotificationService.create_notification(
        db=db,
        user_id=app_record.editor_id,
        title="Application Accepted! 🎉",
        message=f"Your application for '{camp.title}' was accepted! You can now submit your clips.",
        event_type="APPLICATION_ACCEPTED",
        target_url=f"/c/{camp.slug}",
    )

    AuditService.log_audit(
        db=db,
        actor_user_id=current_user.id,
        action="APPLICATION_ACCEPTED",
        resource_type="application",
        resource_id=str(app_record.id),
    )

    return app_record


@router.post("/{application_id}/reject", response_model=ApplicationResponse)
@router.post("/{application_id}/rejected", response_model=ApplicationResponse)
def reject_application(
    application_id: int,
    review: Optional[ApplicationReview] = None,
    current_user: User = Depends(require_role(["creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Creator rejects an editor application."""
    app_record = db.query(CampaignApplication).filter(CampaignApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    camp = app_record.campaign
    if camp.creator_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    app_record.status = "rejected"
    app_record.review_notes = review.review_notes if review else "Rejected by creator"
    app_record.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app_record)

    NotificationService.create_notification(
        db=db,
        user_id=app_record.editor_id,
        title="Application Status Update",
        message=f"Your application for '{camp.title}' was not selected.",
        event_type="APPLICATION_REJECTED",
        target_url=f"/editor/applications",
    )

    return app_record


@router.post("/{application_id}/withdraw")
def withdraw_application(
    application_id: int,
    current_user: User = Depends(require_role(["editor", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Editor withdraws their pending application."""
    app_record = db.query(CampaignApplication).filter(CampaignApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")
    if app_record.editor_id != current_user.id and "superadmin" not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    if app_record.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending applications can be withdrawn.")

    app_record.status = "withdrawn"
    db.commit()
    return {"message": "Application withdrawn successfully."}
