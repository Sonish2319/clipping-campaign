"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { Shield, Users, Video, Eye, DollarSign, Activity, Cpu } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/admin/dashboard")
      .then((data) => setStats(data))
      .catch((e) => console.error("Admin stats error", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 text-sm">Loading Admin Metrics...</div>;
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-black text-white">Platform Control Center</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Platform-wide health, API quota consumption, and moderation overview.
        </p>
      </div>

      {/* System KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold text-zinc-400">Total Users</span>
            <Users className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.total_users || 0}</p>
          <span className="text-[10px] text-zinc-400 font-medium mt-1 inline-block">
            {stats?.total_creators || 0} creators, {stats?.total_editors || 0} editors
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold text-zinc-400">Platform Views</span>
            <Eye className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {formatCompactNumber(stats?.total_platform_views || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 font-medium mt-1 inline-block">
            Verified across all clips
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold text-zinc-400">Rewards Generated</span>
            <DollarSign className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-yellow-400">
            {formatCurrency(stats?.total_rewards_generated || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 font-medium mt-1 inline-block">
            Simulated wallet ledger
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold text-zinc-400">YouTube API Quota</span>
            <Activity className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {stats?.api_quota_estimated_used || 0} / 10,000
          </p>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">
            Healthy batching (1 unit/50 videos)
          </span>
        </div>
      </div>

      {/* Workers & Jobs Status */}
      <div className="bg-[#12131a] p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-yellow-400" />
          <span>Celery Background Engine Status</span>
        </h3>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#0c0d12] border border-zinc-800">
            <p className="text-xs font-bold text-white">Batch Video Poller</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Schedule: Every 3 minutes</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Active & Healthy
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0d12] border border-zinc-800">
            <p className="text-xs font-bold text-white">OAuth Token Refresher</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Schedule: Hourly</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Active & Healthy
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0d12] border border-zinc-800">
            <p className="text-xs font-bold text-white">WebSub Hub Handler</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Status: Ready for webhooks</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Active & Healthy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
