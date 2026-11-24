from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "campaign_marketplace",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.poller"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    worker_prefetch_multiplier=1,
)

# Scheduled Celery Beat Tasks
celery_app.conf.beat_schedule = {
    "poll-active-youtube-videos-every-3-min": {
        "task": "app.tasks.poller.batch_poll_active_videos",
        "schedule": 180.0,  # 3 minutes
    },
    "refresh-expiring-oauth-tokens-hourly": {
        "task": "app.tasks.poller.refresh_expiring_oauth_tokens",
        "schedule": crontab(minute=0, hour="*"),  # hourly
    },
}
