# ClipRewards Platform Policies & Community Standards

## 1. Overview
ClipRewards is a performance-driven creator marketplace where YouTube creators fund clipping campaigns, and skilled video editors produce viral Shorts and clips to scale audience reach. Earnings are mathematically pegged to verified YouTube views.

## 2. Integrity & Anti-Fraud Policy
1. **Strictly Verified Views**: All view metrics are polled directly from Google's official YouTube Data API v3. Self-reported, client-supplied, or scraped analytics are never accepted.
2. **Anti-Bot & Artificial Traffic Ban**: Any use of view bots, click farms, automated refresh scripts, purchased views, or incentivized engagement networks is strictly prohibited. Submissions flagged for unnatural traffic spikes will be permanently disqualified and associated editor wallets frozen.
3. **Unique Video Constraint**: Each YouTube video URL can only be submitted to one campaign across the platform. Submitting the same clip to multiple campaigns or re-submitting previously monetized clips is prevented at the database level.
4. **Ownership Verification**: Editors must link their authentic YouTube channel or demonstrate legitimate upload ownership of submitted videos.

## 3. Creator Guarantees & Budget Safety
1. **Budget Cap Protection**: Once a campaign reaches its designated `total_budget`, no additional reward accrual occurs. Creators are never billed beyond their committed deposit.
2. **Per-Editor Cap**: Creators specify a `max_reward_per_editor` to ensure budget diversity and prevent a single viral clip from draining an entire campaign budget.
3. **Campaign Pausing**: Creators may pause a campaign at any time. When paused, already approved clips continue tracking historical views, but no new clip submissions are permitted.

## 4. Moderation & Dispute Resolution
1. **Review Period**: Creators have full discretion to review pitches, evaluate clip quality, and accept or reject applications.
2. **Rejection with Reason**: Creators rejecting a submission or application must specify valid editorial feedback (e.g., guidelines not met, low effort, audio copyright flags).
3. **Admin Intervention**: Platform administrators can intervene to resolve disputes, review audit logs, and enforce community safety.
