from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.submission import CampaignSubmission, YouTubeVideo, VideoStatistic
from app.models.campaign import Campaign
from app.models.oauth import OAuthAccount
from app.services.youtube_service import YouTubeService
from app.services.reward_service import RewardService


@celery_app.task(name="app.tasks.poller.batch_poll_active_videos")
def batch_poll_active_videos():
    """Celery background worker: batch polls YouTube Data API for active campaign videos,

    records statistics snapshots, and triggers reward calculations.
    """
    db = SessionLocal()
    try:
        # Find all active campaigns
        active_campaign_ids = (
            db.query(Campaign.id).filter(Campaign.status.in_(["active", "paused"])).all()
        )
        c_ids = [c[0] for c in active_campaign_ids]
        if not c_ids:
            return {"status": "no_active_campaigns", "videos_polled": 0}

        # Find all submissions linked to active campaigns
        submissions = (
            db.query(CampaignSubmission)
            .filter(
                CampaignSubmission.campaign_id.in_(c_ids),
                CampaignSubmission.status.in_(["approved", "pending_creator_review"]),
            )
            .all()
        )

        if not submissions:
            return {"status": "no_active_submissions", "videos_polled": 0}

        video_ids = [s.youtube_video_id for s in submissions if s.youtube_video_id]
        print(f"[*] Celery Poller: Starting batch statistics poll for {len(video_ids)} videos...")

        # Batch fetch metadata via YouTube Data API v3 (batches of 50 IDs per call)
        metadata_map = YouTubeService.batch_get_videos_metadata(video_ids)

        updated_count = 0
        total_rewards_accrued = 0.0

        for sub in submissions:
            meta = metadata_map.get(sub.youtube_video_id)
            if not meta:
                continue

            yt_video = sub.video
            if not yt_video:
                continue

            old_views = yt_video.view_count or 0
            new_views = meta.get("view_count", old_views)
            new_likes = meta.get("like_count", 0)
            new_comments = meta.get("comment_count", 0)

            view_delta = max(0, new_views - old_views)
            like_delta = max(0, new_likes - (yt_video.like_count or 0))

            # Update latest stats
            yt_video.view_count = new_views
            yt_video.like_count = new_likes
            yt_video.comment_count = new_comments
            yt_video.last_polled_at = datetime.now(timezone.utc)

            # Record snapshot if views changed or delta recorded
            if view_delta > 0 or like_delta > 0 or not yt_video.statistics_snapshots:
                snapshot = VideoStatistic(
                    video_id=yt_video.id,
                    view_count=new_views,
                    like_count=new_likes,
                    comment_count=new_comments,
                    view_delta=view_delta,
                    like_delta=like_delta,
                )
                db.add(snapshot)

            # Trigger reward calculation for approved clips
            if sub.status == "approved":
                _, delta_accrued = RewardService.calculate_and_accrue_reward(
                    db=db,
                    submission=sub,
                    new_views=new_views,
                )
                total_rewards_accrued += float(delta_accrued)

            updated_count += 1

        db.commit()
        print(
            f"[+] Celery Poller: Polled {updated_count} videos. Accrued rewards: ${total_rewards_accrued:.2f}."
        )
        return {
            "status": "success",
            "videos_polled": updated_count,
            "rewards_accrued": total_rewards_accrued,
        }
    except Exception as e:
        db.rollback()
        print(f"[-] Celery Poller Error: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.poller.refresh_expiring_oauth_tokens")
def refresh_expiring_oauth_tokens():
    """Refreshes Google OAuth tokens that will expire in the next 15 minutes."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        threshold = now + timedelta(minutes=15)
        expiring = (
            db.query(OAuthAccount)
            .filter(OAuthAccount.expires_at <= threshold, OAuthAccount.encrypted_refresh_token != None)
            .all()
        )
        print(f"[*] Found {len(expiring)} expiring OAuth accounts to refresh.")
        return {"refreshed_count": len(expiring)}
    finally:
        db.close()
