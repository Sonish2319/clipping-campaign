"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import {
  Video,
  Eye,
  Users,
  DollarSign,
  TrendingUp,
  PlusCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CreatorDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/analytics/creator")
      .then((res) => setData(res))
      .catch((err) => console.error("Error fetching creator stats", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 text-sm">Loading Creator Dashboard...</div>;
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Creator Studio Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time campaign performance and automated YouTube statistics.
          </p>
        </div>
        <Link
          href="/creator/campaigns/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-md shadow-yellow-500/20 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Launch New Campaign</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold text-zinc-400">Total Views</span>
            <Eye className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {formatCompactNumber(data?.total_views || 0)}
          </p>
          <span className="text-[10px] text-yellow-400 font-bold mt-1 inline-block">
            +18% from last week
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold text-zinc-400">Active Campaigns</span>
            <Video className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {data?.active_campaigns || 0} / {data?.total_campaigns || 0}
          </p>
          <span className="text-[10px] text-zinc-400 font-medium mt-1 inline-block">
            Live on marketplace
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold text-zinc-400">Accepted Editors</span>
            <Users className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {data?.accepted_editors || 0}
          </p>
          <span className="text-[10px] text-zinc-400 font-medium mt-1 inline-block">
            {data?.total_applications || 0} applications received
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold text-zinc-400">Campaign Spending</span>
            <DollarSign className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-yellow-400">
            {formatCurrency(data?.total_spending || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 font-medium mt-1 inline-block">
            Accrued editor rewards
          </span>
        </div>
      </div>

      {/* Chart: Views Over Time with Yellow Gradient */}
      <div className="p-6 rounded-3xl bg-[#12131a] border border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-extrabold text-white">Video Views Growth</h3>
            <p className="text-xs text-zinc-400">7-day performance across all campaign clips</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20">
            <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
            <span>YouTube Data API</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.timeseries || []}>
              <defs>
                <linearGradient id="creatorViewsLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#22232e" />
              <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={formatCompactNumber} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161722",
                  borderRadius: "12px",
                  border: "1px solid #2e303f",
                  color: "#ffffff",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="url(#creatorViewsLine)"
                strokeWidth={3}
                dot={{ r: 4, fill: "#facc15" }}
                activeDot={{ r: 6, fill: "#fbbf24" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Clips & Top Editors */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Clips */}
        <div className="p-6 rounded-3xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <h3 className="text-base font-extrabold text-white mb-4">Top Performing Clips</h3>
          <div className="space-y-3">
            {(!data?.top_clips || data.top_clips.length === 0) ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No clips submitted yet.</p>
            ) : (
              data.top_clips.map((clip: any) => (
                <div
                  key={clip.submission_id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-zinc-800 bg-[#0c0d12] hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={clip.thumbnail_url || `https://img.youtube.com/vi/${clip.video_id}/hqdefault.jpg`}
                      alt="Clip"
                      className="w-12 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1">{clip.video_title}</p>
                      <span className="text-[10px] text-zinc-500">By {clip.editor_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-white">{formatCompactNumber(clip.views)} views</p>
                    <p className="text-[10px] font-bold text-yellow-400">+{formatCurrency(clip.earnings)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Editors */}
        <div className="p-6 rounded-3xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <h3 className="text-base font-extrabold text-white mb-4">Top Editors</h3>
          <div className="space-y-3">
            {(!data?.top_editors || data.top_editors.length === 0) ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No editors yet.</p>
            ) : (
              data.top_editors.map((editor: any) => (
                <div
                  key={editor.editor_id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-zinc-800 bg-[#0c0d12] hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={editor.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
                      alt={editor.editor_name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{editor.editor_name}</p>
                      <span className="text-[10px] text-zinc-500">{editor.total_clips} clips published</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-white">{formatCompactNumber(editor.total_views)} views</p>
                    <p className="text-[10px] font-bold text-yellow-400">+{formatCurrency(editor.total_earnings)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
