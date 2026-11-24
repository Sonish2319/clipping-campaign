"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Campaign, Submission } from "@/types";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { Check, X, ExternalLink, Play } from "lucide-react";

export default function CreatorSubmissionsReviewPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/campaigns/my")
      .then((camps: Campaign[]) => {
        setCampaigns(camps || []);
        if (camps.length > 0) {
          setSelectedCampaignId(camps[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCampaignId) return;
    apiRequest(`/submissions/campaign/${selectedCampaignId}`)
      .then((subs: Submission[]) => setSubmissions(subs || []))
      .catch((e) => console.error("Error loading submissions", e));
  }, [selectedCampaignId]);

  const handleReview = async (subId: number, status: "approved" | "rejected") => {
    try {
      await apiRequest(`/submissions/${subId}/review`, {
        method: "POST",
        body: JSON.stringify({ status, rejection_reason: status === "rejected" ? "Guidelines not met" : null }),
      });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status } : s))
      );
    } catch (e: any) {
      alert(e.message || "Failed to review clip.");
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-white">Submitted Clip Review</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review clips published to YouTube. Approved clips automatically accumulate performance earnings.
        </p>
      </div>

      {/* Campaign Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {campaigns.map((camp) => (
          <button
            key={camp.id}
            onClick={() => setSelectedCampaignId(camp.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCampaignId === camp.id
                ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black shadow-sm"
                : "bg-[#12131a] text-zinc-400 border border-zinc-800 hover:bg-[#161722] hover:text-white"
            }`}
          >
            {camp.title}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-[#12131a]">
            <p className="text-sm font-semibold text-zinc-400">No clips submitted for this campaign yet.</p>
          </div>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-6 rounded-3xl border border-zinc-800 bg-[#12131a] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-zinc-700 transition"
            >
              {/* Video Info */}
              <div className="flex items-start gap-4">
                <div className="relative aspect-video w-36 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-zinc-800">
                  <img
                    src={sub.video?.thumbnail_url || `https://img.youtube.com/vi/${sub.youtube_video_id}/hqdefault.jpg`}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href={sub.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center hover:scale-110 transition shadow-lg"
                    >
                      <Play className="w-4 h-4 fill-zinc-950 text-transparent" />
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {sub.video?.title || `Clip #${sub.youtube_video_id}`}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Submitted by <strong className="text-zinc-200">{sub.editor?.full_name || sub.editor?.email}</strong>
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                    <span>Views: <strong className="text-white">{formatCompactNumber(sub.current_views)}</strong></span>
                    <span>Likes: <strong className="text-white">{formatCompactNumber(sub.video?.like_count || 0)}</strong></span>
                    <span>Accrued: <strong className="text-amber-400">{formatCurrency(sub.estimated_earnings)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                    sub.status === "approved"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                      : sub.status === "rejected"
                      ? "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                      : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                  }`}
                >
                  {sub.status.replace("_", " ")}
                </span>

                {sub.status !== "approved" && (
                  <button
                    onClick={() => handleReview(sub.id, "approved")}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition"
                  >
                    <Check className="w-3.5 h-3.5 text-zinc-950" /> Approve Clip
                  </button>
                )}
                {sub.status !== "rejected" && (
                  <button
                    onClick={() => handleReview(sub.id, "rejected")}
                    className="px-3 py-2 rounded-xl border border-zinc-800 bg-[#161722] hover:bg-rose-950/40 text-rose-400 hover:border-rose-800/50 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
