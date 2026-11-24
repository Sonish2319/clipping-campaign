"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Application } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  PlusCircle,
  Compass,
  ArrowRight,
  AlertCircle,
  Trash2,
} from "lucide-react";

export default function EditorApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/applications/my");
      setApplications(data || []);
    } catch (e) {
      console.error("Error loading editor applications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (appId: number) => {
    if (!confirm("Are you sure you want to withdraw this application?")) return;
    setWithdrawingId(appId);
    try {
      await apiRequest(`/applications/${appId}/withdraw`, { method: "POST" });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "withdrawn" } : a))
      );
    } catch (err: any) {
      alert(err.message || "Failed to withdraw application.");
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Campaign Applications</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track creator approval status and submit clips for accepted campaigns.
          </p>
        </div>
        <Link
          href="/editor/discover"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition"
        >
          <Compass className="w-4 h-4 text-zinc-950" />
          <span>Find More Campaigns</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(["all", "pending", "accepted", "rejected"] as const).map((tab) => {
          const count =
            tab === "all"
              ? applications.length
              : applications.filter((a) => a.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize flex items-center gap-1.5 ${
                filter === tab
                  ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black shadow-sm"
                  : "bg-[#12131a] text-zinc-400 border border-zinc-800 hover:bg-[#161722] hover:text-white"
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === tab
                    ? "bg-zinc-950 text-amber-400 font-black"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-400">Loading applications...</div>
        ) : filteredApps.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-zinc-800 bg-[#12131a] px-4">
            <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No applications found</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Explore open campaigns in the marketplace and apply with your viral clipping ideas.
            </p>
            <Link
              href="/editor/discover"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black text-xs shadow transition"
            >
              <span>Browse Active Campaigns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-3xl border border-zinc-800 bg-[#12131a] shadow-sm space-y-4 hover:border-zinc-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                    <FileText className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                        Campaign #{app.campaign_id}
                      </span>
                      <span className="text-[10px] text-zinc-500">•</span>
                      <span className="text-[10px] text-zinc-500">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {app.campaign?.title || `Campaign #${app.campaign_id}`}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
                      app.status === "accepted"
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                        : app.status === "rejected"
                        ? "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                        : app.status === "withdrawn"
                        ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                    }`}
                  >
                    {app.status === "accepted" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {app.status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                    {app.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                    <span>{app.status}</span>
                  </span>

                  {app.status === "accepted" && (
                    <button
                      onClick={() => router.push(`/editor/submissions?campaign_id=${app.campaign_id}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow transition flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Submit Clip</span>
                    </button>
                  )}

                  {app.status === "pending" && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      disabled={withdrawingId === app.id}
                      className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-[#161722] hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/50 text-xs font-semibold text-zinc-400 transition"
                    >
                      {withdrawingId === app.id ? "Withdrawing..." : "Withdraw"}
                    </button>
                  )}
                </div>
              </div>

              {/* Pitch & Strategy */}
              <div className="p-4 rounded-2xl bg-[#161722] border border-zinc-800/80 text-xs text-zinc-300 space-y-2">
                <div>
                  <strong className="text-amber-400 block mb-0.5">My Pitch:</strong>
                  <p className="leading-relaxed">{app.pitch_message}</p>
                </div>
                {app.proposed_strategy && (
                  <div>
                    <strong className="text-zinc-200 block mb-0.5">Proposed Strategy:</strong>
                    <p className="leading-relaxed text-zinc-400">{app.proposed_strategy}</p>
                  </div>
                )}
                {app.review_notes && (
                  <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                    <strong className="text-white block">Creator Feedback:</strong>
                    <p>{app.review_notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
