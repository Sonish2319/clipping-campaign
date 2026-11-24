"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Submission, Application } from "@/types";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { PlusCircle, Play, RefreshCw, AlertCircle } from "lucide-react";

function EditorSubmissionsContent() {
  const searchParams = useSearchParams();
  const initialCampaignId = searchParams.get("campaign_id");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allApps, setAllApps] = useState<Application[]>([]);
  const [acceptedApps, setAcceptedApps] = useState<Application[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [subs, apps] = await Promise.all([
        apiRequest("/submissions/my"),
        apiRequest("/applications/my"),
      ]);
      setSubmissions(subs || []);
      setAllApps(apps || []);
      const accepted = (apps || []).filter((a: Application) => a.status === "accepted");
      setAcceptedApps(accepted);

      if (initialCampaignId) {
        const found = accepted.find((a: Application) => a.campaign_id === Number(initialCampaignId));
        if (found) {
          setSelectedCampaignId(found.campaign_id);
          setModalOpen(true);
        } else if (accepted.length > 0) {
          setSelectedCampaignId(accepted[0].campaign_id);
        }
      } else if (accepted.length > 0) {
        setSelectedCampaignId(accepted[0].campaign_id);
      }
    } catch (e) {
      console.error("Error loading submissions", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [initialCampaignId]);

  const handleSubmitClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) return;
    setSubmitting(true);
    setError("");
    try {
      const newSub = await apiRequest(`/submissions/campaigns/${selectedCampaignId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          campaign_id: selectedCampaignId,
          youtube_url: youtubeUrl,
        }),
      });
      setSubmissions([newSub, ...submissions]);
      setModalOpen(false);
      setYoutubeUrl("");
      alert("Clip submitted successfully! Automated tracking has commenced.");
    } catch (err: any) {
      setError(err.message || "Failed to submit clip.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncNow = async (videoId: string) => {
    setSyncingId(videoId);
    try {
      await apiRequest(`/youtube/sync-video/${videoId}`, { method: "POST" });
      await fetchData();
    } catch (e) {
      console.error("Sync error", e);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Clip Submissions</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Submit published YouTube videos and track views and performance rewards automatically.
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition"
        >
          <PlusCircle className="w-4 h-4 text-zinc-950" />
          <span>Submit YouTube Clip</span>
        </button>
      </div>

      {/* Submissions Table */}
      <div className="rounded-3xl border border-zinc-800 bg-[#12131a] overflow-hidden shadow-sm">
        {submissions.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 px-4">
            <p className="text-sm font-semibold text-white">No clips submitted yet</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Apply to active campaigns, wait for creator acceptance, and submit your live YouTube video or Short URL.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/editor/discover"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black text-xs shadow transition"
              >
                Find Campaigns
              </Link>
              <Link
                href="/editor/applications"
                className="px-4 py-2 rounded-xl border border-zinc-800 bg-[#161722] text-zinc-200 text-xs font-bold hover:bg-[#1f2030] transition"
              >
                View My Applications
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#161722]/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="relative aspect-video w-32 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-zinc-800">
                    <img
                      src={sub.video?.thumbnail_url || `https://img.youtube.com/vi/${sub.youtube_video_id}/hqdefault.jpg`}
                      alt="Clip"
                      className="w-full h-full object-cover"
                    />
                    <a
                      href={sub.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition"
                    >
                      <Play className="w-4 h-4 fill-white text-transparent" />
                    </a>
                  </div>

                  <div>
                    {sub.campaign?.title && (
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                        {sub.campaign.title}
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {sub.video?.title || `Clip #${sub.youtube_video_id}`}
                    </h4>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Submitted on {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="font-semibold text-zinc-400">
                        Views: <strong className="text-white">{formatCompactNumber(sub.current_views)}</strong>
                      </span>
                      <span className="font-semibold text-zinc-400">
                        Likes: <strong className="text-white">{formatCompactNumber(sub.video?.like_count || 0)}</strong>
                      </span>
                      <span className="font-semibold text-amber-400">
                        Earned: <strong>{formatCurrency(sub.estimated_earnings)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

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

                  <button
                    onClick={() => handleSyncNow(sub.youtube_video_id)}
                    disabled={syncingId === sub.youtube_video_id}
                    title="Poll latest stats from YouTube API"
                    className="p-2 rounded-xl border border-zinc-800 bg-[#161722] text-zinc-400 hover:text-amber-400 hover:border-amber-400/40 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === sub.youtube_video_id ? "animate-spin text-amber-400" : ""}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Clip Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#12131a] p-6 shadow-2xl border border-zinc-800 text-white">
            <h3 className="text-lg font-black text-white">Submit YouTube Clip</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Link the live YouTube Short or video you published for an accepted campaign.
            </p>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitClip} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Target Campaign *</label>
                {acceptedApps.length > 0 ? (
                  <select
                    value={selectedCampaignId || ""}
                    onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  >
                    {acceptedApps.map((a) => (
                      <option key={a.id} value={a.campaign_id} className="bg-[#12131a] text-white">
                        {a.campaign
                          ? `${a.campaign.title} ($${a.campaign.reward_per_1000_views}/1k views)`
                          : `Campaign #${a.campaign_id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#161722] border border-amber-400/30 text-xs text-amber-300 space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-amber-400">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      No Accepted Campaign Applications Yet
                    </p>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {allApps.length > 0
                        ? `You have applied to ${allApps.length} campaign(s), but they are still pending creator approval. Once accepted by the creator, you can submit clip URLs here.`
                        : "You have not applied to any campaigns yet. Browse campaigns in the marketplace and apply first!"}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href="/editor/discover"
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 rounded-lg text-[10px] font-black transition"
                      >
                        Find Campaigns
                      </Link>
                      <Link
                        href="/editor/applications"
                        className="px-3 py-1.5 bg-[#161722] border border-zinc-700 hover:bg-[#1f2030] text-zinc-300 rounded-lg text-[10px] font-bold transition"
                      >
                        View My Applications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Published YouTube URL *</label>
                <input
                  required
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/shorts/M7lc1UVf-VE"
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Supports YouTube watch links, shorts links, or youtu.be URLs.
                </span>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-[#161722] text-xs font-semibold text-zinc-300 hover:bg-[#1f2030]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || acceptedApps.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition"
                >
                  {submitting ? "Verifying..." : "Submit Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorSubmissionsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-zinc-400">Loading submissions...</div>}>
      <EditorSubmissionsContent />
    </Suspense>
  );
}
