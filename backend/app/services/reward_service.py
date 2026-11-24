import math
from decimal import Decimal
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.campaign import Campaign
from app.models.submission import CampaignSubmission
from app.models.wallet import Wallet, RewardTransaction
from app.models.notification import Notification


class RewardService:
    @staticmethod
    def calculate_and_accrue_reward(
        db: Session,
        submission: CampaignSubmission,
        new_views: int,
    ) -> Tuple[Decimal, Decimal]:
        """Calculates performance reward for a submission based on verified views.

        Formula:
            eligible_views = max(0, new_views - baseline_views)
            calculated_reward = floor(eligible_views / 1000) * reward_per_1000_views
            reward = min(calculated_reward, max_reward_per_editor, remaining_campaign_budget)

        Returns:
            Tuple of (new_estimated_earnings, delta_accrued)
        """
        campaign = db.query(Campaign).filter(Campaign.id == submission.campaign_id).first()
        if not campaign:
            return Decimal("0.00"), Decimal("0.00")

        # Update current views
        submission.current_views = new_views

        # Only approved submissions accumulate rewards
        if submission.status != "approved":
            db.commit()
            return Decimal("0.00"), Decimal("0.00")

        # Calculate eligible views
        baseline = submission.baseline_views or 0
        eligible_views = max(0, new_views - baseline)
        submission.eligible_views = eligible_views

        # Calculate thousands blocks
        thousands_milestone = math.floor(eligible_views / 1000)
        calculated_raw = Decimal(thousands_milestone) * Decimal(str(campaign.reward_per_1000_views))

        # Cap by max_reward_per_editor
        max_per_editor = Decimal(str(campaign.max_reward_per_editor))
        capped_by_editor = min(calculated_raw, max_per_editor)

        # Cap by available campaign budget
        current_submission_earnings = submission.estimated_earnings or Decimal("0.00")
        potential_delta = capped_by_editor - current_submission_earnings

        if potential_delta <= Decimal("0.00"):
            # No new milestone reached
            db.commit()
            return current_submission_earnings, Decimal("0.00")

        remaining_budget = Decimal(str(campaign.remaining_budget))
        actual_delta = min(potential_delta, remaining_budget)

        if actual_delta > Decimal("0.00"):
            new_estimated = current_submission_earnings + actual_delta
            submission.estimated_earnings = new_estimated

            # Deduct from campaign remaining budget and add to total accumulated views
            campaign.remaining_budget = remaining_budget - actual_delta
            if campaign.remaining_budget <= Decimal("0.00"):
                campaign.status = "completed"

            # Update Editor's Wallet
            wallet = db.query(Wallet).filter(Wallet.user_id == submission.editor_id).first()
            if not wallet:
                wallet = Wallet(user_id=submission.editor_id)
                db.add(wallet)
                db.flush()

            wallet.estimated_balance = (wallet.estimated_balance or Decimal("0.00")) + actual_delta

            # Append immutable transaction to ledger
            tx = RewardTransaction(
                wallet_id=wallet.id,
                submission_id=submission.id,
                campaign_id=campaign.id,
                amount=actual_delta,
                transaction_type="accrual",
                status="confirmed",
                views_milestone=eligible_views,
                description=f"Reward accrued for reaching {eligible_views:,} eligible views on '{campaign.title}'",
            )
            db.add(tx)

            # In-app notification
            notification = Notification(
                user_id=submission.editor_id,
                title="Reward Accrued! 💰",
                message=f"You earned +${actual_delta:.2f} for reaching {eligible_views:,} views on '{campaign.title}'.",
                event_type="REWARD_ACCRUED",
                target_url="/editor/earnings",
            )
            db.add(notification)

            db.commit()
            return new_estimated, actual_delta

        db.commit()
        return current_submission_earnings, Decimal("0.00")
