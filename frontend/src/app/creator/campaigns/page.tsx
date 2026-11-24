"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Campaign } from "@/types";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { PlusCircle, Play, Pause, ExternalLink } from "lucide-react";

export default function CreatorCampaignsListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const data = await apiRequest("/campaigns/my");
      setCampaigns(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleTogglePause = async (id: number, currentStatus: string) => {
    try {
      const endpoint = currentStatus === "active" ? `/campaigns/${id}/pause` : `/campaigns/${id}/resume`;
      await apiRequest(endpoint, { method: "POST" });
      await fetchCampaigns();
    } catch (e: any) {
      alert(e.message || "Failed to update campaign status.");
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Campaigns</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage, pause, or launch your video clipping campaigns.</p>
        </div>
        <Link
          href="/creator/campaigns/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition"
        >
          <PlusCircle className="w-4 h-4 text-zinc-950" />
          <span>New Campaign</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-[#12131a] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold text-white">You haven't created any campaigns yet.</p>
            <Link
              href="/creator/campaigns/create"
              className="mt-3 inline-block text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline"
            >
              Create your first campaign →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#161722]/50 transition">
                <div className="flex items-start gap-4">
                  <img
                    src={camp.thumbnail_url || `https://img.youtube.com/vi/${camp.original_video_id}/hqdefault.jpg`}
                    alt={camp.title}
                    className="w-28 aspect-video rounded-xl object-cover bg-black flex-shrink-0 border border-zinc-800"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 uppercase">
                        {camp.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          camp.status === "active"
                            ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                            : camp.status === "paused"
                            ? "bg-zinc-800 text-zinc-400"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{camp.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                      <span>Reward: <strong className="text-amber-400">{formatCurrency(camp.reward_per_1000_views)}/1k views</strong></span>
                      <span>Budget: <strong className="text-white">{formatCurrency(camp.remaining_budget)} / {formatCurrency(camp.total_budget)}</strong></span>
                      <span>Editors: <strong className="text-white">{camp.approved_editors_count}/{camp.max_editors}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/c/${camp.slug}`}
                    className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-[#161722] hover:bg-[#1f2030] text-xs font-semibold text-zinc-300 transition flex items-center gap-1.5"
                  >
                    <span>Marketplace</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  {(camp.status === "active" || camp.status === "paused") && (
                    <button
                      onClick={() => handleTogglePause(camp.id, camp.status)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        camp.status === "active"
                          ? "border border-zinc-700 bg-[#161722] text-zinc-300 hover:bg-[#1f2030]"
                          : "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20"
                      }`}
                    >
                      {camp.status === "active" ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
