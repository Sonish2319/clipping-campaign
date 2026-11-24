"""Database initialization and seeding script.

Creates all tables, system roles, granular permissions, the initial superadmin,
and demo creator and editor profiles with live-like campaigns, submissions,
and statistics snapshots.
"""

import sys
import os
from datetime import datetime, timedelta, timezone

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models import (
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    UserProfile,
    YouTubeChannel,
    Campaign,
    CampaignApplication,
    CampaignSubmission,
    YouTubeVideo,
    VideoStatistic,
    Wallet,
    RewardTransaction,
    Notification,
    PlatformSetting,
    AuditLog,
)


def seed_database():
    print(f"[*] Connecting to database at {settings.MYSQL_HOST}:{settings.MYSQL_PORT}...")
    print("[*] Creating all database tables if they do not exist...")
    Base.metadata.create_all(bind=engine)
    print("[+] Database tables verified/created successfully.")

    db = SessionLocal()
    try:
        # 1. Seed Roles
        role_names = {
            "superadmin": "Platform super administrator with full governance access",
            "creator": "YouTube content creator who funds and manages clipping campaigns",
            "editor": "Video editor who creates clips, publishes to YouTube, and earns rewards",
        }

        roles_dict = {}
        for r_name, r_desc in role_names.items():
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name, description=r_desc)
                db.add(role)
                db.flush()
                print(f"[+] Created role: {r_name}")
            roles_dict[r_name] = role

        # 2. Seed Permissions
        permissions_data = [
            # Campaigns
            ("campaign:create", "campaign", "Create new campaigns"),
            ("campaign:edit", "campaign", "Edit owned campaigns"),
            ("campaign:pause", "campaign", "Pause and resume campaigns"),
            ("campaign:delete", "campaign", "Delete campaigns"),
            ("campaign:approve", "campaign", "Approve pending campaigns (Admin)"),
            ("campaign:reject", "campaign", "Reject pending campaigns (Admin)"),
            ("campaign:read_all", "campaign", "Read all campaigns including drafts"),
            # Applications
            ("application:apply", "application", "Apply to active campaigns"),
            ("application:review", "application", "Accept or reject applications"),
            ("application:withdraw", "application", "Withdraw submitted applications"),
            # Submissions
            ("submission:create", "submission", "Submit published clip URLs"),
            ("submission:approve", "submission", "Approve submitted clips"),
            ("submission:reject", "submission", "Reject submitted clips"),
            # Governance & Wallet
            ("user:manage", "user", "Manage users and roles"),
            ("wallet:read", "wallet", "Read wallet balance and earnings"),
            ("wallet:adjust", "wallet", "Adjust user wallet manually (Admin)"),
            ("audit:read", "audit", "Inspect platform audit logs"),
            ("system:manage", "system", "Configure system-wide settings"),
        ]

        perms_dict = {}
        for p_code, p_module, p_desc in permissions_data:
            perm = db.query(Permission).filter(Permission.code == p_code).first()
            if not perm:
                perm = Permission(code=p_code, module=p_module, description=p_desc)
                db.add(perm)
                db.flush()
            perms_dict[p_code] = perm

        # Assign permissions to roles
        # Superadmin has everything
        for perm in perms_dict.values():
            existing = (
                db.query(RolePermission)
                .filter(
                    RolePermission.role_id == roles_dict["superadmin"].id,
                    RolePermission.permission_id == perm.id,
                )
                .first()
            )
            if not existing:
                db.add(RolePermission(role_id=roles_dict["superadmin"].id, permission_id=perm.id))

        # Creator permissions
        creator_perms = [
            "campaign:create",
            "campaign:edit",
            "campaign:pause",
            "application:review",
            "submission:approve",
            "submission:reject",
            "wallet:read",
        ]
        for cp in creator_perms:
            existing = (
                db.query(RolePermission)
                .filter(
                    RolePermission.role_id == roles_dict["creator"].id,
                    RolePermission.permission_id == perms_dict[cp].id,
                )
                .first()
            )
            if not existing:
                db.add(RolePermission(role_id=roles_dict["creator"].id, permission_id=perms_dict[cp].id))

        # Editor permissions
        editor_perms = [
            "application:apply",
            "application:withdraw",
            "submission:create",
            "wallet:read",
        ]
        for ep in editor_perms:
            existing = (
                db.query(RolePermission)
                .filter(
                    RolePermission.role_id == roles_dict["editor"].id,
                    RolePermission.permission_id == perms_dict[ep].id,
                )
                .first()
            )
            if not existing:
                db.add(RolePermission(role_id=roles_dict["editor"].id, permission_id=perms_dict[ep].id))

        db.commit()

        # 3. Seed Platform Settings
        default_settings = [
            ("min_clip_duration_seconds", "15", "Global minimum video clip duration"),
            ("max_clip_duration_seconds", "180", "Global maximum video clip duration"),
            ("default_currency", "USD", "Platform currency"),
            ("max_payout_per_submission", "1000", "Maximum reward limit per submission in USD"),
            ("quota_alert_threshold", "8500", "YouTube API daily quota warning threshold"),
        ]
        for key, val, desc in default_settings:
            setting = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
            if not setting:
                db.add(PlatformSetting(key=key, value=val, description=desc))
        db.commit()

        # 4. Seed Superadmin
        admin = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.SUPERADMIN_EMAIL,
                hashed_password=get_password_hash(settings.SUPERADMIN_PASSWORD),
                full_name=settings.SUPERADMIN_NAME,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
                is_active=True,
                is_verified=True,
                selected_role="superadmin",
            )
            db.add(admin)
            db.flush()

            db.add(UserRole(user_id=admin.id, role_id=roles_dict["superadmin"].id))
            db.add(
                UserProfile(
                    user_id=admin.id,
                    bio="Chief Platform Administrator overseeing campaigns and integrity.",
                    country="United States",
                    contact_email=settings.SUPERADMIN_EMAIL,
                )
            )
            db.add(Wallet(user_id=admin.id))
            db.commit()
            print(f"[+] Created Superadmin: {settings.SUPERADMIN_EMAIL} (Pass: {settings.SUPERADMIN_PASSWORD})")

        # 5. Seed Demo Creator
        creator_email = "creator@apexvisuals.com"
        creator = db.query(User).filter(User.email == creator_email).first()
        if not creator:
            creator = User(
                email=creator_email,
                hashed_password=get_password_hash("CreatorPass123!"),
                full_name="Apex Visuals Studio",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
                is_active=True,
                is_verified=True,
                selected_role="creator",
            )
            db.add(creator)
            db.flush()

            db.add(UserRole(user_id=creator.id, role_id=roles_dict["creator"].id))
            db.add(
                UserProfile(
                    user_id=creator.id,
                    bio="Gaming and tech review creator with over 1.2M subscribers on YouTube.",
                    country="Canada",
                    website_url="https://apexvisuals.media",
                    contact_email=creator_email,
                    social_links={"youtube": "https://youtube.com/@apexvisuals"},
                )
            )
            db.add(Wallet(user_id=creator.id))
            db.add(
                YouTubeChannel(
                    user_id=creator.id,
                    channel_id="UC_apex_visuals_official",
                    channel_title="Apex Visuals Official",
                    custom_url="@apexvisuals",
                    thumbnail_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
                    subscriber_count=1240000,
                    video_count=340,
                    is_verified_owner=True,
                )
            )
            db.commit()
            print(f"[+] Created Creator: {creator_email} (Pass: CreatorPass123!)")

        # 6. Seed Demo Editor
        editor_email = "alex.editor@viralclips.io"
        editor = db.query(User).filter(User.email == editor_email).first()
        if not editor:
            editor = User(
                email=editor_email,
                hashed_password=get_password_hash("EditorPass123!"),
                full_name="Alex Rivera (Viral Clips)",
                avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces",
                is_active=True,
                is_verified=True,
                selected_role="editor",
            )
            db.add(editor)
            db.flush()

            db.add(UserRole(user_id=editor.id, role_id=roles_dict["editor"].id))
            db.add(
                UserProfile(
                    user_id=editor.id,
                    bio="Full-time short-form editor specializing in retention editing, sound design, and viral hooks.",
                    country="United Kingdom",
                    website_url="https://riveraclips.com",
                    contact_email=editor_email,
                    social_links={"twitter": "@riveraclips"},
                )
            )
            editor_wallet = Wallet(user_id=editor.id, estimated_balance=185.00, available_balance=85.00)
            db.add(editor_wallet)
            db.add(
                YouTubeChannel(
                    user_id=editor.id,
                    channel_id="UC_viral_shorts_nexus",
                    channel_title="Nexus Shorts Daily",
                    custom_url="@nexushorts",
                    thumbnail_url="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&h=200&fit=crop",
                    subscriber_count=85000,
                    video_count=142,
                    is_verified_owner=True,
                )
            )
            db.commit()
            print(f"[+] Created Editor: {editor_email} (Pass: EditorPass123!)")

        # 7. Seed Demo Campaigns
        campaigns_data = [
            {
                "title": "Minecraft 100 Days Hardcore Survival - Best Funny Moments",
                "slug": "minecraft-100-days-hardcore-survival-best-moments",
                "description": (
                    "Turn our epic 100 Days Minecraft Hardcore video into engaging 30-60 second Shorts/Reels! "
                    "Focus on funny deaths, close calls with creepers, and insane redstone builds. "
                    "Make sure to include dynamic subtitles and viral hooks within the first 3 seconds."
                ),
                "original_video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "original_video_id": "dQw4w9WgXcQ",
                "thumbnail_url": "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=800&h=450&fit=crop",
                "category": "Gaming",
                "target_audience": "Teens and young adults who love Minecraft and gaming humor",
                "reward_per_1000_views": 2.50,
                "max_reward_per_editor": 250.00,
                "total_budget": 1250.00,
                "remaining_budget": 1065.00,
                "max_editors": 15,
                "approved_editors_count": 4,
                "total_views_accumulated": 74000,
                "start_date": datetime.now(timezone.utc) - timedelta(days=7),
                "end_date": datetime.now(timezone.utc) + timedelta(days=23),
                "min_clip_duration_sec": 20,
                "max_clip_duration_sec": 60,
                "required_hashtags": "#minecraft #hardcore #gaming #shorts",
                "required_description_text": "Clip from @apexvisuals full 100 days series. Watch the full episode on main channel!",
                "allowed_rules": "Add engaging captions, sound effects, zooms, and trending background music.",
                "disallowed_rules": "No offensive language, clickbait misleading thumbnails, or unedited raw footage.",
                "status": "active",
            },
            {
                "title": "Top 5 Game-Changing AI Tools of 2025 - 60s Tech Explainer",
                "slug": "top-5-game-changing-ai-tools-2025-explainer",
                "description": (
                    "Extract each AI tool demo from our long-form video into its own standalone 45-second high-value "
                    "tech tip short. Focus on how regular users can save 10 hours a week using these automated workflows."
                ),
                "original_video_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
                "original_video_id": "jNQXAC9IVRw",
                "thumbnail_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop",
                "category": "Technology",
                "target_audience": "Developers, creators, and productivity enthusiasts",
                "reward_per_1000_views": 3.00,
                "max_reward_per_editor": 300.00,
                "total_budget": 2000.00,
                "remaining_budget": 1850.00,
                "max_editors": 20,
                "approved_editors_count": 6,
                "total_views_accumulated": 50000,
                "start_date": datetime.now(timezone.utc) - timedelta(days=4),
                "end_date": datetime.now(timezone.utc) + timedelta(days=26),
                "min_clip_duration_sec": 30,
                "max_clip_duration_sec": 60,
                "required_hashtags": "#aitools #tech #productivity #future",
                "required_description_text": "Full AI breakdown on Apex Visuals YouTube channel.",
                "allowed_rules": "Highlight key UI moments, fast pacing, clear kinetic typography.",
                "disallowed_rules": "No low-resolution re-renders under 1080x1920.",
                "status": "active",
            },
            {
                "title": "$10,000 Mystery Tech Unboxing - React & Highlights",
                "slug": "10000-dollar-mystery-tech-unboxing-highlights",
                "description": (
                    "Highlight the biggest surprises and craziest gadget reveals from our $10k mystery pallet unboxing! "
                    "High energy cuts and instant punchlines perform best."
                ),
                "original_video_url": "https://www.youtube.com/watch?v=9bZkp7q19f0",
                "original_video_id": "9bZkp7q19f0",
                "thumbnail_url": "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&h=450&fit=crop",
                "category": "Entertainment",
                "target_audience": "Gadget lovers and general entertainment viewers",
                "reward_per_1000_views": 2.00,
                "max_reward_per_editor": 200.00,
                "total_budget": 800.00,
                "remaining_budget": 800.00,
                "max_editors": 10,
                "approved_editors_count": 1,
                "total_views_accumulated": 0,
                "start_date": datetime.now(timezone.utc) - timedelta(days=1),
                "end_date": datetime.now(timezone.utc) + timedelta(days=29),
                "min_clip_duration_sec": 15,
                "max_clip_duration_sec": 59,
                "required_hashtags": "#unboxing #techgadgets #mysterybox",
                "required_description_text": "Check out Apex Visuals for more crazy tech experiments!",
                "allowed_rules": "High contrast edits, expressive reaction cutaways.",
                "disallowed_rules": "No spoilery titles in the first 2 seconds.",
                "status": "active",
            },
        ]

        seeded_campaigns = []
        for c_data in campaigns_data:
            camp = db.query(Campaign).filter(Campaign.slug == c_data["slug"]).first()
            if not camp:
                camp = Campaign(creator_id=creator.id, **c_data)
                db.add(camp)
                db.flush()
                print(f"[+] Created Campaign: {c_data['title']}")
            seeded_campaigns.append(camp)
        db.commit()

        # 8. Seed Application and Submission for Demo Editor
        first_campaign = seeded_campaigns[0]
        app_record = (
            db.query(CampaignApplication)
            .filter(
                CampaignApplication.campaign_id == first_campaign.id,
                CampaignApplication.editor_id == editor.id,
            )
            .first()
        )
        if not app_record:
            app_record = CampaignApplication(
                campaign_id=first_campaign.id,
                editor_id=editor.id,
                pitch_message="I have over 3 years of experience crafting viral Minecraft clips that average 100k+ views on Shorts. I will use 3D text hooks and sound effects to maximize audience retention.",
                proposed_strategy="3 Shorts focusing on: 1) The sudden Creeper jumpscare, 2) The Nether fortress escape, 3) The Dragon fight climax.",
                portfolio_url="https://youtube.com/@nexushorts",
                status="accepted",
                reviewed_at=datetime.now(timezone.utc) - timedelta(days=5),
            )
            db.add(app_record)
            db.flush()
            print("[+] Created Accepted Application for Demo Editor")

            # Seed Submission
            submission = CampaignSubmission(
                campaign_id=first_campaign.id,
                application_id=app_record.id,
                editor_id=editor.id,
                youtube_url="https://www.youtube.com/watch?v=M7lc1UVf-VE",
                youtube_video_id="M7lc1UVf-VE",
                status="approved",
                baseline_views=500,
                current_views=42500,
                eligible_views=42000,
                estimated_earnings=105.00,  # 42 * 2.50
                approved_earnings=105.00,
                approved_at=datetime.now(timezone.utc) - timedelta(days=2),
            )
            db.add(submission)
            db.flush()

            # Seed YouTubeVideo Metadata
            yt_video = YouTubeVideo(
                submission_id=submission.id,
                video_id="M7lc1UVf-VE",
                channel_id="UC_viral_shorts_nexus",
                channel_title="Nexus Shorts Daily",
                title="The Funniest Creeper Jumpscare in Minecraft Hardcore History! #shorts",
                description="Watch what happens when you turn around after 99 days! Credit @apexvisuals #minecraft #gaming",
                thumbnail_url="https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=600&h=800&fit=crop",
                duration_seconds=38,
                published_at=datetime.now(timezone.utc) - timedelta(days=3),
                privacy_status="public",
                view_count=42500,
                like_count=3120,
                comment_count=184,
                last_polled_at=datetime.now(timezone.utc) - timedelta(minutes=2),
            )
            db.add(yt_video)
            db.flush()

            # Seed Historical Statistics Snapshots
            snapshots = [
                (12000, 890, 45, 12000, 890, timedelta(days=2, hours=12)),
                (24500, 1850, 98, 12500, 960, timedelta(days=1, hours=18)),
                (35200, 2600, 140, 10700, 750, timedelta(hours=14)),
                (42500, 3120, 184, 7300, 520, timedelta(minutes=2)),
            ]
            for vc, lc, cc, v_delta, l_delta, td in snapshots:
                db.add(
                    VideoStatistic(
                        video_id=yt_video.id,
                        view_count=vc,
                        like_count=lc,
                        comment_count=cc,
                        view_delta=v_delta,
                        like_delta=l_delta,
                        recorded_at=datetime.now(timezone.utc) - td,
                    )
                )

            # Seed Reward Transaction
            editor_wallet_obj = db.query(Wallet).filter(Wallet.user_id == editor.id).first()
            if editor_wallet_obj:
                reward_tx = RewardTransaction(
                    wallet_id=editor_wallet_obj.id,
                    submission_id=submission.id,
                    campaign_id=first_campaign.id,
                    amount=105.00,
                    transaction_type="accrual",
                    status="confirmed",
                    views_milestone=42000,
                    description="Performance reward for 42,000 eligible views on 'The Funniest Creeper Jumpscare'",
                )
                db.add(reward_tx)

            # Seed Notification
            db.add(
                Notification(
                    user_id=editor.id,
                    title="Submission Approved! 🚀",
                    message="Your clip 'The Funniest Creeper Jumpscare' has been approved by Apex Visuals. Automated view tracking is active.",
                    event_type="SUBMISSION_APPROVED",
                    target_url=f"/editor/submissions",
                )
            )

            # Seed Audit Log
            db.add(
                AuditLog(
                    actor_user_id=creator.id,
                    action="SUBMISSION_APPROVED",
                    resource_type="submission",
                    resource_id=str(submission.id),
                    new_state={"status": "approved", "youtube_video_id": "M7lc1UVf-VE"},
                )
            )

            db.commit()
            print("[+] Seeded Demo Submission, YouTube Video metadata, snapshots & ledger.")

        print("\n=======================================================")
        print("SEEDING COMPLETE!")
        print("Available Login Accounts:")
        print(f"1) Superadmin : {settings.SUPERADMIN_EMAIL} | Pass: {settings.SUPERADMIN_PASSWORD}")
        print(f"2) Creator    : {creator_email}           | Pass: CreatorPass123!")
        print(f"3) Editor     : {editor_email}        | Pass: EditorPass123!")
        print("=======================================================\n")

    except Exception as e:
        db.rollback()
        print(f"[-] Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
