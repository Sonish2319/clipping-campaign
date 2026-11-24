# Payout Mechanics & Automated View Verification

## 1. Reward Formula
Rewards are calculated on verified view counts according to the campaign's published rate:
$$\text{Estimated Earnings} = \left( \frac{\text{Current Verified Views}}{1,000} \right) \times \text{Reward Rate per 1k Views}$$

**Example**:
If a campaign pays **$2.50 per 1,000 views**, and your approved clip achieves **48,000 verified views**:
$$\text{Earnings} = \frac{48,000}{1,000} \times \$2.50 = 48 \times \$2.50 = \$120.00$$

## 2. Payout Caps & Limits
1. **Per-Editor Cap**: If a campaign specifies a `max_reward_per_editor` of $250.00, your total accrued rewards across all clips for that specific campaign cannot exceed $250.00.
2. **Campaign Budget Cap**: When a campaign's `remaining_budget` drops to $0.00, no further rewards accrue.
3. **Minimum Payout**: The default minimum withdrawal threshold from the editor wallet is $20.00.

## 3. Automated Verification Engine
1. **Scheduled Polling**: Our Celery background workers execute automated snapshot queries every **3 minutes** via the official Google YouTube Data API v3.
2. **Snapshot History**: Every poll records the timestamped view count, like count, and comment count in an immutable timeseries table (`video_snapshots`).
3. **Fraud Anomaly Detection**: Sudden impossible jumps (e.g., 50k views in 30 seconds with 0 likes) trigger audit flags for manual administrative review.

## 4. Wallet Balances
- **Estimated Accrued**: Real-time calculated balance earned by your live approved YouTube clips.
- **Approved / Available**: Balance confirmed by creator approval milestones and ready for withdrawal or simulation transfer.
- **Total Paid Out**: Historical record of settled transfers.
