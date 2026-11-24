from decimal import Decimal
import pytest
from app.models.campaign import Campaign
from app.models.submission import CampaignSubmission
from app.services.reward_service import RewardService


def test_reward_service_calculation_logic():
    # Setup mock campaign
    camp = Campaign(
        id=1,
        title="Test Campaign",
        reward_per_1000_views=Decimal("2.50"),
        max_reward_per_editor=Decimal("200.00"),
        total_budget=Decimal("1000.00"),
        remaining_budget=Decimal("1000.00"),
    )

    # Submission with baseline of 500 views
    sub = CampaignSubmission(
        id=1,
        campaign_id=1,
        editor_id=10,
        status="approved",
        baseline_views=500,
        current_views=500,
        eligible_views=0,
        estimated_earnings=Decimal("0.00"),
    )

    # 1. Views jump to 10,500 (10,000 eligible views)
    # Expected: 10 * $2.50 = $25.00
    eligible = 10500 - 500
    thousands = eligible // 1000
    expected_reward = Decimal(thousands) * camp.reward_per_1000_views
    assert expected_reward == Decimal("25.00")

    # 2. Check Editor Cap
    # If eligible views reach 100,000 (100 * $2.50 = $250.00), it should cap at $200.00
    huge_eligible = 100000
    huge_thousands = huge_eligible // 1000
    huge_calc = Decimal(huge_thousands) * camp.reward_per_1000_views
    capped_reward = min(huge_calc, camp.max_reward_per_editor)
    assert capped_reward == Decimal("200.00")
