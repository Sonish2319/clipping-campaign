"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Campaign, Application } from "@/types";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Send,
  ExternalLink,
} from "lucide-react";

export default function CampaignDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [pitch, setPitch] = useState("");
  const [strategy, setStrategy] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (!slug) return;
    apiRequest(`/campaigns/${slug}`)
      .then((data) => {
        setCampaign(data);
        if (user) {
          apiRequest("/applications/my")
            .then((apps: Application[]) => {
              const matched = apps.find((a) => a.campaign_id === data.id);
              if (matched) setExistingApplication(matched);
            })
            .catch(() => {});
        }
      })
      .catch((e) => console.error("Error loading campaign", e))
      .finally(() => setLoading(false));
  }, [slug, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;
    setSubmitting(true);
    try {
      const res = await apiRequest(`/applications/campaigns/${campaign.id}/apply`, {
        method: "POST",
        body: JSON.stringify({
          pitch_message: pitch,
          proposed_strategy: strategy,
          portfolio_url: portfolio,
        }),
      });
      setExistingApplication(res);
      setApplyModalOpen(false);
      alert("Application submitted successfully! The creator will review your pitch.");
    } catch (err: any) {
      alert(err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="h-8 bg-zinc-800 rounded w-1/3 mx-auto animate-pulse mb-4" />
        <div className="h-64 bg-zinc-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-white">
        <h2 className="text-2xl font-bold">Campaign not found</h2>
      </div>
    );
  }

  const budgetSpent = campaign.total_budget - campaign.remaining_budget;
  const progressPercent = Math.min(100, Math.round((budgetSpent / (campaign.total_budget || 1)) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-zinc-100">
      {/* Top Banner / Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
          {campaign.category}
        </span>
        <span className="text-xs font-semibold text-zinc-400">
          Status: <strong className="text-amber-400 uppercase">{campaign.status}</strong>
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
        {campaign.title}
      </h1>

      {/* Creator Info Bar */}
      <div className="flex items-center gap-3 mt-4 pb-6 border-b border-zinc-800">
        <img
          src={
            campaign.creator?.avatar_url ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
          }
          alt="Creator"
          className="w-10 h-10 rounded-full object-cover border border-zinc-700"
        />
        <div>
          <p className="text-sm font-bold text-white">
            {campaign.creator?.full_name || "Verified Creator"}
          </p>
          <a
            href={campaign.original_video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium"
          >
            Watch original video on YouTube <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Grid: Player & Reward Structure */}
      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        {/* Left Column: Video Preview & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Video Preview */}
          <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl bg-black border border-zinc-800">
            <iframe
              src={`https://www.youtube.com/embed/${campaign.original_video_id}`}
              title={campaign.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Description */}
          <div className="bg-[#12131a] p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-white">Campaign Instructions</h3>
            <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
              {campaign.description}
            </p>
            {campaign.instructions && (
              <div className="p-4 rounded-2xl bg-[#161722] border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
                <strong className="block text-amber-400 mb-1">Editor Guidance:</strong>
                {campaign.instructions}
              </div>
            )}
          </div>

          {/* Rules & Requirements */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-emerald-900/40 bg-emerald-950/20">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Allowed Rules</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {campaign.allowed_rules || "High retention cuts, captions, sound effects, zooms."}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-rose-900/40 bg-rose-950/20">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Disallowed Rules</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {campaign.disallowed_rules || "No unedited raw clips, clickbait, or vulgar content."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Reward Economics & Apply Action */}
        <div className="space-y-6">
          <div className="bg-[#12131a] p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-5">
            <h3 className="font-extrabold text-xs uppercase text-zinc-400 tracking-wider">
              Reward Structure
            </h3>

            <div className="p-4 rounded-2xl bg-[#161722] border border-amber-400/20 text-center">
              <p className="text-xs font-bold text-amber-400 uppercase">Rate Per 1,000 Views</p>
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 mt-1">
                {formatCurrency(campaign.reward_per_1000_views)}
              </p>
            </div>

            <div className="space-y-3 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
              <div className="flex justify-between">
                <span>Max Reward per Editor:</span>
                <span className="font-bold text-white">
                  {formatCurrency(campaign.max_reward_per_editor)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Campaign Budget:</span>
                <span className="font-bold text-white">
                  {formatCurrency(campaign.total_budget)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Budget:</span>
                <span className="font-bold text-amber-400">
                  {formatCurrency(campaign.remaining_budget)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Clip Duration Limit:</span>
                <span className="font-bold text-white">
                  {campaign.min_clip_duration_sec}s - {campaign.max_clip_duration_sec}s
                </span>
              </div>
            </div>

            {/* Budget Bar */}
            <div className="pt-2">
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                  style={{ width: `${100 - progressPercent}%` }}
                />
              </div>
            </div>

            {/* Application CTA */}
            {existingApplication ? (
              <div className="p-4 rounded-2xl bg-[#161722] border border-amber-400/20 text-center">
                <p className="text-xs font-bold text-zinc-200">
                  Application Status:{" "}
                  <span className="uppercase text-amber-400 font-extrabold">{existingApplication.status}</span>
                </p>
                {existingApplication.status === "accepted" ? (
                  <button
                    onClick={() => router.push("/editor/submissions")}
                    className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition"
                  >
                    Submit Clip URL
                  </button>
                ) : (
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Your application is currently under review by the creator.
                  </p>
                )}
              </div>
            ) : user ? (
              <button
                onClick={() => setApplyModalOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-zinc-950" /> Apply to Campaign
              </button>
            ) : (
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm shadow transition"
              >
                Sign In to Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#12131a] p-6 shadow-2xl border border-zinc-800 text-white">
            <h3 className="text-xl font-black text-white">Apply to Campaign</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Share your pitch and strategy with {campaign.creator?.full_name || "the creator"}.
            </p>

            <form onSubmit={handleApply} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Why are you the right editor? (Pitch) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="Tell the creator about your editing style, pacing, and viral hooks..."
                  className="w-full p-3 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Proposed Clip Strategy (Optional)
                </label>
                <input
                  type="text"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  placeholder="e.g. 3 shorts focusing on funny reactions and climax"
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Portfolio / YouTube Channel URL (Optional)
                </label>
                <input
                  type="url"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-[#161722] text-xs font-semibold text-zinc-300 hover:bg-[#1f2030]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  {submitting ? "Submitting..." : "Send Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
