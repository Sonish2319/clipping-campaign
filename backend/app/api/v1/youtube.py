import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import encrypt_secret
from app.models.oauth import YouTubeChannel, OAuthAccount
from app.models.submission import YouTubeVideo
from app.models.user import User
from app.api.deps import get_current_user, require_role
from app.services.youtube_service import YouTubeService
from app.services.reward_service import RewardService

router = APIRouter(prefix="/youtube", tags=["YouTube Integration"])


class YouTubeOAuthCallbackRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


@router.get("/connect-url")
def get_youtube_connect_url(redirect_uri: Optional[str] = None):
    """Generates official Google OAuth 2.0 authorization URL to connect YouTube channel."""
    target_redirect = redirect_uri or settings.YOUTUBE_OAUTH_REDIRECT_URI
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": target_redirect,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/youtube.readonly",
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return {"url": url, "redirect_uri": target_redirect}


@router.post("/oauth-callback")
async def youtube_oauth_callback(
    payload: YouTubeOAuthCallbackRequest,
    current_user: User = Depends(require_role(["editor", "creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Exchanges YouTube OAuth authorization code, fetches channel using mine=true,

    and securely stores ownership and encrypted tokens.
    """
    target_redirect = payload.redirect_uri or settings.YOUTUBE_OAUTH_REDIRECT_URI

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth credentials not configured on backend.",
        )

    # 1. Exchange code for access & refresh tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": payload.code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": target_redirect,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_resp = await client.post(token_url, data=token_data)
        if token_resp.status_code != 200:
            err_text = token_resp.text
            print(f"[!] YouTube token exchange error: {err_text}")
            raise HTTPException(
                status_code=400,
                detail=f"YouTube token exchange failed: {err_text}",
            )
        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in", 3600)

        # 2. Fetch authenticated user's YouTube Channel via mine=true
        channels_url = "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true"
        chan_resp = await client.get(
            channels_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if chan_resp.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to fetch YouTube channel details: {chan_resp.text}",
            )
        chan_data = chan_resp.json()
        items = chan_data.get("items", [])
        if not items:
            raise HTTPException(
                status_code=400,
                detail="No YouTube channel found associated with this Google account.",
            )

        channel_item = items[0]
        c_id = channel_item.get("id")
        snippet = channel_item.get("snippet", {})
        statistics = channel_item.get("statistics", {})

    # 3. Store / update YouTubeChannel
    existing = db.query(YouTubeChannel).filter(YouTubeChannel.channel_id == c_id).first()
    if existing:
        existing.user_id = current_user.id
        existing.channel_title = snippet.get("title", existing.channel_title)
        existing.custom_url = snippet.get("customUrl", existing.custom_url)
        existing.thumbnail_url = snippet.get("thumbnails", {}).get("default", {}).get("url")
        existing.subscriber_count = int(statistics.get("subscriberCount", existing.subscriber_count))
        existing.video_count = int(statistics.get("videoCount", existing.video_count))
        existing.is_verified_owner = True
        channel = existing
    else:
        channel = YouTubeChannel(
            user_id=current_user.id,
            channel_id=c_id,
            channel_title=snippet.get("title", "My YouTube Channel"),
            custom_url=snippet.get("customUrl"),
            thumbnail_url=snippet.get("thumbnails", {}).get("default", {}).get("url"),
            subscriber_count=int(statistics.get("subscriberCount", 0)),
            video_count=int(statistics.get("videoCount", 0)),
            is_verified_owner=True,
        )
        db.add(channel)

    # 4. Save OAuthAccount with encrypted tokens
    token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    oauth_acc = (
        db.query(OAuthAccount)
        .filter(OAuthAccount.user_id == current_user.id, OAuthAccount.provider == "google_youtube")
        .first()
    )
    if not oauth_acc:
        oauth_acc = OAuthAccount(
            user_id=current_user.id,
            provider="google_youtube",
            provider_user_id=c_id,
            encrypted_access_token=encrypt_secret(access_token),
            encrypted_refresh_token=encrypt_secret(refresh_token) if refresh_token else None,
            expires_at=token_expires_at,
            scopes="https://www.googleapis.com/auth/youtube.readonly",
        )
        db.add(oauth_acc)
    else:
        oauth_acc.encrypted_access_token = encrypt_secret(access_token)
        if refresh_token:
            oauth_acc.encrypted_refresh_token = encrypt_secret(refresh_token)
        oauth_acc.expires_at = token_expires_at

    db.commit()
    db.refresh(channel)

    return {
        "message": "YouTube channel verified and connected successfully!",
        "channel": {
            "channel_id": channel.channel_id,
            "title": channel.channel_title,
            "subscriber_count": channel.subscriber_count,
            "custom_url": channel.custom_url,
        },
    }


@router.post("/connect-channel")
def connect_youtube_channel(
    channel_id: str,
    channel_title: Optional[str] = None,
    current_user: User = Depends(require_role(["editor", "creator", "superadmin"])),
    db: Session = Depends(get_db),
):
    """Fallback manual connection of a YouTube channel by ID."""
    existing = (
        db.query(YouTubeChannel)
        .filter(YouTubeChannel.channel_id == channel_id, YouTubeChannel.user_id == current_user.id)
        .first()
    )
    if existing:
        return {"message": "Channel is already connected.", "channel_id": channel_id}

    # Fetch channel info from YouTube API
    info = YouTubeService.get_channel_details(channel_id)

    channel = YouTubeChannel(
        user_id=current_user.id,
        channel_id=channel_id,
        channel_title=info.get("title") or channel_title or f"Channel {channel_id[-6:]}",
        custom_url=info.get("custom_url"),
        thumbnail_url=info.get("thumbnail_url"),
        subscriber_count=info.get("subscriber_count", 0),
        video_count=info.get("video_count", 0),
        is_verified_owner=True,
    )
    db.add(channel)
    db.commit()
    db.refresh(channel)

    return {"message": "YouTube channel connected successfully.", "channel": channel.channel_title}


@router.get("/channels")
def list_user_channels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns connected YouTube channels for current user."""
    channels = db.query(YouTubeChannel).filter(YouTubeChannel.user_id == current_user.id).all()
    return [
        {
            "id": c.id,
            "channel_id": c.channel_id,
            "channel_title": c.channel_title,
            "custom_url": c.custom_url,
            "thumbnail_url": c.thumbnail_url,
            "subscriber_count": c.subscriber_count,
            "video_count": c.video_count,
            "connected_at": c.created_at,
        }
        for c in channels
    ]


@router.post("/sync-video/{video_id}")
def sync_single_video_stats(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """On-demand sync of YouTube video statistics."""
    yt_video = db.query(YouTubeVideo).filter(YouTubeVideo.video_id == video_id).first()
    if not yt_video:
        raise HTTPException(status_code=404, detail="Tracked video not found.")

    meta = YouTubeService.get_video_metadata(video_id)
    if not meta:
        raise HTTPException(status_code=400, detail="Unable to retrieve latest stats from YouTube.")

    old_views = yt_video.view_count or 0
    new_views = meta.get("view_count", old_views)
    yt_video.view_count = new_views
    yt_video.like_count = meta.get("like_count", yt_video.like_count)
    yt_video.comment_count = meta.get("comment_count", yt_video.comment_count)
    yt_video.last_polled_at = datetime.now(timezone.utc)

    # Recalculate reward if submission exists
    sub = yt_video.submission
    new_earnings = sub.estimated_earnings
    if sub and sub.status == "approved":
        new_earnings, _ = RewardService.calculate_and_accrue_reward(db=db, submission=sub, new_views=new_views)

    db.commit()
    return {
        "video_id": video_id,
        "views": new_views,
        "likes": yt_video.like_count,
        "estimated_earnings": new_earnings,
        "synced_at": yt_video.last_polled_at,
    }


@router.get("/websub/callback")
def websub_verification(
    request: Request,
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
):
    """WebSub/PubSubHubbub challenge verification handler."""
    if hub_challenge:
        return Response(content=hub_challenge, media_type="text/plain")
    return {"status": "ok"}


@router.post("/websub/callback")
async def websub_notification(request: Request, db: Session = Depends(get_db)):
    """Receives WebSub feed notifications when connected channel uploads a video."""
    body = await request.body()
    print(f"[*] Received WebSub notification payload size: {len(body)} bytes.")
    return Response(status_code=200)
