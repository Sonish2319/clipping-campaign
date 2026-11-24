"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Campaign, Application } from "@/types";
import { Check, X, ExternalLink } from "lucide-react";

export default function CreatorApplicationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
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
    apiRequest(`/applications/campaign/${selectedCampaignId}`)
      .then((apps: Application[]) => setApplications(apps || []))
      .catch((e) => console.error("Error loading applications", e));
  }, [selectedCampaignId]);

  const handleReview = async (appId: number, status: "accepted" | "rejected") => {
    try {
      const action = status === "accepted" ? "accept" : "reject";
      await apiRequest(`/applications/${appId}/${action}`, {
        method: "POST",
        body: JSON.stringify({ review_notes: `Reviewed as ${status}` }),
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status } : a))
      );
    } catch (e: any) {
      alert(e.message || "Failed to update application.");
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-white">Campaign Applications</h1>
        <p className="text-xs text-zinc-400 mt-1">Review editor pitches and accept qualified creators.</p>
      </div>

      {/* Campaign Selector Tabs */}
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

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-[#12131a]">
            <p className="text-sm font-semibold text-zinc-300">No applications received for this campaign yet.</p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-3xl border border-zinc-800 bg-[#12131a] shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={app.editor?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
                    alt="Editor"
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{app.editor?.full_name || app.editor?.email}</h4>
                    <span className="text-[10px] text-zinc-400">
                      Applied on {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                      app.status === "accepted"
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                        : app.status === "rejected"
                        ? "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                        : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              </div>

              {/* Pitch */}
              <div className="p-4 rounded-2xl bg-[#161722] border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
                <strong className="block text-amber-400 mb-1">Editor Pitch:</strong>
                {app.pitch_message}
                {app.proposed_strategy && (
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <strong className="block text-white mb-0.5">Strategy:</strong>
                    {app.proposed_strategy}
                  </div>
                )}
                {app.portfolio_url && (
                  <a
                    href={app.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline font-semibold"
                  >
                    View Portfolio / Channel <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Actions */}
              {app.status === "pending" && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleReview(app.id, "rejected")}
                    className="px-4 py-2 rounded-xl border border-zinc-800 bg-[#161722] hover:bg-rose-950/40 text-rose-400 hover:border-rose-800/50 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => handleReview(app.id, "accepted")}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-zinc-950" /> Accept Editor
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
