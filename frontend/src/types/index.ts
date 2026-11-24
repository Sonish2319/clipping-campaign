export interface User {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  selected_role?: "creator" | "editor" | "superadmin";
  roles: string[];
}

export interface CreatorSummary {
  id: number;
  full_name?: string;
  avatar_url?: string;
}

export interface Campaign {
  id: number;
  creator_id: number;
  creator?: CreatorSummary;
  title: string;
  slug: string;
  description: string;
  original_video_url: string;
  original_video_id: string;
  thumbnail_url?: string;
  category: string;
  target_audience?: string;
  reward_per_1000_views: number;
  max_reward_per_editor: number;
  total_budget: number;
  remaining_budget: number;
  max_editors: number;
  approved_editors_count: number;
  total_views_accumulated: number;
  start_date?: string;
  end_date?: string;
  min_clip_duration_sec: number;
  max_clip_duration_sec: number;
  instructions?: string;
  required_hashtags?: string;
  required_description_text?: string;
  allowed_rules?: string;
  disallowed_rules?: string;
  status: "draft" | "pending_approval" | "active" | "paused" | "completed" | "rejected";
  created_at: string;
}

export interface Application {
  id: number;
  campaign_id: number;
  campaign?: Campaign;
  editor_id: number;
  editor?: User;
  pitch_message: string;
  proposed_strategy?: string;
  portfolio_url?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface YouTubeVideoInfo {
  id: number;
  video_id: string;
  channel_id: string;
  channel_title?: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration_seconds: number;
  published_at?: string;
  privacy_status: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  last_polled_at?: string;
}

export interface Submission {
  id: number;
  campaign_id: number;
  campaign?: Campaign;
  application_id: number;
  editor_id: number;
  editor?: User;
  youtube_url: string;
  youtube_video_id: string;
  status: "pending_verification" | "pending_creator_review" | "approved" | "rejected" | "suspended";
  rejection_reason?: string;
  baseline_views: number;
  current_views: number;
  eligible_views: number;
  estimated_earnings: number;
  approved_earnings: number;
  approved_at?: string;
  created_at: string;
  video?: YouTubeVideoInfo;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  event_type: string;
  target_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  estimated_balance: number;
  available_balance: number;
  total_paid_out: number;
  currency: string;
  updated_at: string;
}
