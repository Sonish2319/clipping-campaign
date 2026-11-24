"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Youtube, Plus, CheckCircle2, ExternalLink } from "lucide-react";

export default function EditorChannelsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [channelId, setChannelId] = useState("");
  const [channelTitle, setChannelTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const fetchChannels = async () => {
    try {
      const data = await apiRequest("/youtube/channels");
      setChannels(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleOAuthConnect = async () => {
    setOauthLoading(true);
    try {
      const origin = typeof window !== "undefined" && window.location.origin.includes("127.0.0.1")
        ? "http://localhost:3000"
        : window.location.origin;
      const redirectUri = `${origin}/editor/channels/callback`;
      const res = await apiRequest(`/youtube/connect-url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (res.url) {
        window.location.href = res.url;
      } else {
        alert("Could not generate YouTube authorization URL.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to initiate YouTube connection.");
    } finally {
      setOauthLoading(false);
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest(`/youtube/connect-channel?channel_id=${channelId}&channel_title=${encodeURIComponent(channelTitle)}`, {
        method: "POST",
      });
      setChannelId("");
      setChannelTitle("");
      await fetchChannels();
      alert("YouTube channel connected successfully!");
    } catch (e: any) {
      alert(e.message || "Failed to connect channel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-white">Connected YouTube Channels</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Link your YouTube channel to verify clip ownership and track subscriber growth.
        </p>
      </div>

      {/* Official YouTube OAuth Button */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-[#161722] to-[#12131a] border border-red-500/30 text-white shadow-lg shadow-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Youtube className="w-5 h-5 fill-red-500 text-transparent" />
            <span>Official YouTube Channel Connection</span>
          </h3>
          <p className="text-xs text-zinc-300 mt-1 max-w-md leading-relaxed">
            Authorize your YouTube channel directly via Google OAuth to automatically pull channel subscriber counts, videos, and verify ownership.
          </p>
        </div>
        <button
          onClick={handleOAuthConnect}
          disabled={oauthLoading}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition whitespace-nowrap flex items-center justify-center gap-2"
        >
          <Youtube className="w-4 h-4 fill-zinc-950 text-transparent" />
          <span>{oauthLoading ? "Connecting..." : "Connect YouTube Account"}</span>
        </button>
      </div>

      {/* Fallback Manual Channel ID Form */}
      <form onSubmit={handleManualConnect} className="p-6 rounded-3xl bg-[#12131a] border border-zinc-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Manual Channel ID Connection (Alternative)</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          If you prefer not to authorize via OAuth or are testing locally, manually enter your YouTube Channel ID (e.g. <code className="text-amber-400 bg-zinc-800 px-1 py-0.5 rounded">UC...</code>).
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">Channel ID *</label>
            <input
              required
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="UC_x5XG1OV2P6uZZ5FSM9Ttw"
              className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">Channel Name (Optional)</label>
            <input
              type="text"
              value={channelTitle}
              onChange={(e) => setChannelTitle(e.target.value)}
              placeholder="e.g. My Shorts Channel"
              className="w-full p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-zinc-950" />
          <span>{loading ? "Adding..." : "Add Channel"}</span>
        </button>
      </form>

      {/* Connected Channels List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white">Your Connected Channels</h3>
        {channels.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-zinc-800 bg-[#12131a] text-xs text-zinc-400">
            No channels linked yet. Connect via OAuth or manual ID above.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {channels.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-[#12131a] border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/30 text-red-500 flex items-center justify-center font-bold">
                    <Youtube className="w-5 h-5 fill-red-500 text-transparent" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{c.channel_title || c.channel_id}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono">{c.channel_id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
