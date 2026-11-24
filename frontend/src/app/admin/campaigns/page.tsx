"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Check, X } from "lucide-react";

export default function AdminCampaignModerationPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const data = await apiRequest("/admin/campaigns");
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

  const handleAction = async (campaignId: number, action: "approve" | "reject") => {
    try {
      await apiRequest(`/admin/campaigns/${campaignId}/${action}`, { method: "POST" });
      await fetchCampaigns();
    } catch (e: any) {
      alert(e.message || "Failed to update campaign.");
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-white">Campaign Moderation</h1>
        <p className="text-xs text-zinc-400 mt-1">Review and approve public creator campaigns.</p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-[#12131a] overflow-hidden shadow-sm divide-y divide-zinc-800/80">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">No campaigns pending moderation.</div>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} className="p-5 flex items-center justify-between gap-4 hover:bg-[#161722]/50 transition">
              <div className="flex items-center gap-4">
                <img
                  src={c.thumbnail_url || `https://img.youtube.com/vi/${c.original_video_id}/hqdefault.jpg`}
                  alt="Thumbnail"
                  className="w-20 h-12 rounded-xl object-cover bg-black border border-zinc-800"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{c.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Budget: <strong className="text-white">{formatCurrency(c.total_budget)}</strong> • Rate: <strong className="text-amber-400">{formatCurrency(c.reward_per_1000_views)}/1k views</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                    c.status === "active"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                      : c.status === "rejected"
                      ? "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                      : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                  }`}
                >
                  {c.status}
                </span>

                {c.status !== "active" && (
                  <button
                    onClick={() => handleAction(c.id, "approve")}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs transition flex items-center gap-1 shadow-md shadow-amber-500/20"
                  >
                    <Check className="w-3.5 h-3.5 text-zinc-950" /> Approve
                  </button>
                )}
                {c.status !== "rejected" && (
                  <button
                    onClick={() => handleAction(c.id, "reject")}
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-800 bg-[#161722] hover:bg-rose-950/40 text-rose-400 hover:border-rose-800/50 text-xs font-bold transition flex items-center gap-1"
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
