"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { AlertCircle } from "lucide-react";

export default function CreateCampaignPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("Gaming");
  const [rewardPer1k, setRewardPer1k] = useState("2.50");
  const [maxRewardEditor, setMaxRewardEditor] = useState("250.00");
  const [budget, setBudget] = useState("1000.00");
  const [maxEditors, setMaxEditors] = useState(10);
  const [allowedRules, setAllowedRules] = useState("Add kinetic subtitles, high retention zooms, sound effects.");
  const [disallowedRules, setDisallowedRules] = useState("No unedited raw footage or misleading clickbait.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          original_video_url: videoUrl,
          category,
          reward_per_1000_views: parseFloat(rewardPer1k),
          max_reward_per_editor: parseFloat(maxRewardEditor),
          total_budget: parseFloat(budget),
          max_editors: Number(maxEditors),
          allowed_rules: allowedRules,
          disallowed_rules: disallowedRules,
          status: "active",
        }),
      });
      router.push(`/c/${res.slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to create campaign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-white">Create New Campaign</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Incentivize video editors to create viral YouTube Shorts from your content.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-400 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#12131a] p-8 rounded-3xl border border-zinc-800 shadow-sm">
        {/* Basic Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Campaign Details</h3>
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">Campaign Title *</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Minecraft 100 Days Hardcore Survival - Best Moments"
              className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">Original YouTube Video URL *</label>
            <input
              required
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Provide your long-form YouTube video URL. Editors will clip from this video.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              >
                <option value="Gaming" className="bg-[#12131a] text-white">Gaming</option>
                <option value="Technology" className="bg-[#12131a] text-white">Technology</option>
                <option value="Entertainment" className="bg-[#12131a] text-white">Entertainment</option>
                <option value="Education" className="bg-[#12131a] text-white">Education</option>
                <option value="Music" className="bg-[#12131a] text-white">Music</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Max Approved Editors *</label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxEditors}
                onChange={(e) => setMaxEditors(Number(e.target.value))}
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">Instructions for Editors *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the moments you want highlighted, the target hook, and tone..."
              className="w-full p-3 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Financials & Rates */}
        <div className="space-y-4 pt-6 border-t border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Budget & Reward Rates</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Reward / 1,000 Views ($) *</label>
              <input
                required
                type="number"
                step="0.10"
                min="0.50"
                value={rewardPer1k}
                onChange={(e) => setRewardPer1k(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Max Reward / Editor ($) *</label>
              <input
                required
                type="number"
                step="1.00"
                value={maxRewardEditor}
                onChange={(e) => setMaxRewardEditor(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Total Campaign Budget ($) *</label>
              <input
                required
                type="number"
                step="10.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Content Rules */}
        <div className="space-y-4 pt-6 border-t border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Content Rules</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Allowed Guidelines</label>
              <textarea
                rows={2}
                value={allowedRules}
                onChange={(e) => setAllowedRules(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Disallowed Guidelines</label>
              <textarea
                rows={2}
                value={disallowedRules}
                onChange={(e) => setDisallowedRules(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition"
        >
          {loading ? "Publishing Campaign..." : "Publish Campaign to Marketplace"}
        </button>
      </form>
    </div>
  );
}
