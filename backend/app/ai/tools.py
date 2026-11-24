from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from app.models.campaign import Campaign
from app.models.submission import CampaignSubmission, YouTubeVideo
from app.models.user import User


# ==============================================================================
# Tool Implementations (Constrained Read-Only Projections)
# ==============================================================================

def execute_get_active_campaigns(
    category: Optional[str] = None,
    min_reward: Optional[float] = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """Retrieve active campaigns matching criteria."""
    db: Session = SessionLocal()
    try:
        query = db.query(Campaign).filter(
            Campaign.status == "active",
            Campaign.remaining_budget > 0
        )
        if category and category.lower() != "all":
            query = query.filter(Campaign.category.ilike(f"%{category}%"))
        if min_reward is not None:
            query = query.filter(Campaign.reward_per_1000_views >= min_reward)

        campaigns = query.order_by(Campaign.reward_per_1000_views.desc()).limit(min(limit, 10)).all()
        return [
            {
                "id": c.id,
                "title": c.title,
                "slug": c.slug,
                "category": c.category,
                "reward_per_1000_views": float(c.reward_per_1000_views),
                "remaining_budget": float(c.remaining_budget),
                "duration_limit": f"{c.min_clip_duration_sec}s - {c.max_clip_duration_sec}s",
                "rules_summary": c.allowed_rules or "High-retention editing, kinetic subtitles, clean audio.",
            }
            for c in campaigns
        ]
    finally:
        db.close()


def execute_get_campaign_details(identifier: str) -> Optional[Dict[str, Any]]:
    """Look up a specific campaign by slug or integer ID."""
    db: Session = SessionLocal()
    try:
        query = db.query(Campaign)
        if identifier.isdigit():
            c = query.filter(Campaign.id == int(identifier)).first()
        else:
            c = query.filter(Campaign.slug == identifier).first()

        if not c:
            return None

        return {
            "title": c.title,
            "slug": c.slug,
            "category": c.category,
            "status": c.status,
            "description": c.description,
            "instructions": c.instructions or "Focus on high-action highlights and viral moments.",
            "allowed_rules": c.allowed_rules or "Kinetic subtitles, sound effects, zooms.",
            "disallowed_rules": c.disallowed_rules or "No unedited raw footage or misleading clickbait.",
            "reward_per_1000_views": float(c.reward_per_1000_views),
            "max_reward_per_editor": float(c.max_reward_per_editor),
            "remaining_budget": float(c.remaining_budget),
            "duration_limit": f"{c.min_clip_duration_sec}s to {c.max_clip_duration_sec}s",
        }
    finally:
        db.close()


def execute_get_top_leaderboard(limit: int = 5) -> List[Dict[str, Any]]:
    """Retrieve top-performing clips by verified YouTube view count."""
    db: Session = SessionLocal()
    try:
        subs = (
            db.query(CampaignSubmission)
            .filter(CampaignSubmission.status == "approved")
            .options(
                joinedload(CampaignSubmission.video),
                joinedload(CampaignSubmission.campaign),
                joinedload(CampaignSubmission.editor),
            )
            .order_by(CampaignSubmission.current_views.desc())
            .limit(min(limit, 10))
            .all()
        )
        return [
            {
                "title": s.video.title if s.video else f"Clip #{s.youtube_video_id}",
                "youtube_url": s.youtube_url,
                "verified_views": s.current_views,
                "likes": s.video.like_count if s.video else 0,
                "estimated_earnings": float(s.estimated_earnings),
                "campaign_title": s.campaign.title if s.campaign else "Unknown",
                "campaign_slug": s.campaign.slug if s.campaign else "",
            }
            for s in subs
        ]
    finally:
        db.close()


def execute_get_my_submissions(user_id: int) -> List[Dict[str, Any]]:
    """Retrieve submissions for the currently authenticated user."""
    if not user_id:
        return [{"error": "Authentication required to view personal submission status."}]

    db: Session = SessionLocal()
    try:
        subs = (
            db.query(CampaignSubmission)
            .filter(CampaignSubmission.editor_id == user_id)
            .options(
                joinedload(CampaignSubmission.campaign),
                joinedload(CampaignSubmission.video),
            )
            .order_by(CampaignSubmission.created_at.desc())
            .limit(10)
            .all()
        )
        return [
            {
                "clip_title": s.video.title if s.video else f"Clip #{s.youtube_video_id}",
                "campaign_title": s.campaign.title if s.campaign else "Unknown",
                "campaign_slug": s.campaign.slug if s.campaign else "",
                "status": s.status,
                "views": s.current_views,
                "earned": float(s.estimated_earnings),
                "rejection_reason": s.rejection_reason,
            }
            for s in subs
        ]
    finally:
        db.close()


# ==============================================================================
# Tool Definitions for Function Calling (OpenAI & Gemini Compatible)
# ==============================================================================

AVAILABLE_TOOLS_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_active_campaigns",
            "description": "Search and list live, active creator clipping campaigns on the marketplace. Use when user asks for open campaigns, gaming campaigns, highest paying campaigns, or recommendations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Filter by category, e.g. Gaming, Technology, Entertainment, Education, Music",
                    },
                    "min_reward": {
                        "type": "number",
                        "description": "Minimum reward rate in USD per 1,000 views, e.g. 2.0 or 2.5",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max number of campaigns to return (default 5)",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_campaign_details",
            "description": "Get detailed instructions, duration rules, and allowed/disallowed guidelines for a specific campaign by slug or ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "identifier": {
                        "type": "string",
                        "description": "The campaign slug (e.g. 'minecraft-hardcore') or campaign numeric ID.",
                    },
                },
                "required": ["identifier"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_leaderboard",
            "description": "Get the top-ranked clips on the platform ordered by verified YouTube views.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of top clips to return (default 5)",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_policies",
            "description": "Search platform rules, guidelines, payout caps, video duration rules, and FAQs stored in the knowledge base.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Semantic query describing policy topic (e.g. 'payout calculation formula', 'duration limits', 'allowed music')",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_submissions_status",
            "description": "Check the status and verified earnings of the currently logged-in editor's submitted clips.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
]
