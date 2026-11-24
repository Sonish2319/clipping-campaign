"use client";

import React from "react";
import Link from "next/link";
import { Campaign } from "@/types";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { Eye, Users, ArrowUpRight } from "lucide-react";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  // Budget spent percentage
  const budgetSpent = campaign.total_budget - campaign.remaining_budget;
  const progressPercent = Math.min(100, Math.round((budgetSpent / (campaign.total_budget || 1)) * 100));

  return (
    <div className="group flex flex-col rounded-3xl border border-zinc-800/90 bg-[#12131a] shadow-md hover:shadow-2xl hover:border-yellow-400/40 transition-all duration-300 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <img
          src={
            campaign.thumbnail_url ||
            `https://img.youtube.com/vi/${campaign.original_video_id}/hqdefault.jpg`
          }
          alt={campaign.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/80 text-zinc-200 border border-white/10 shadow-md backdrop-blur">
            {campaign.category}
          </span>
        </div>

        {/* Reward Pill */}
        <div className="absolute bottom-3 right-3">
          <div className="px-3 py-1.5 rounded-xl bg-amber-400 text-zinc-950 font-black text-xs shadow-lg backdrop-blur flex items-center gap-1">
            <span>{formatCurrency(campaign.reward_per_1000_views)}</span>
            <span className="font-bold text-[10px] opacity-80">/ 1k views</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div>
          {/* Creator Info */}
          <div className="flex items-center gap-2 mb-2">
            <img
              src={
                campaign.creator?.avatar_url ||
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
              }
              alt="Creator"
              className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-700"
            />
            <span className="text-xs font-semibold text-zinc-400 truncate">
              {campaign.creator?.full_name || "Verified Creator"}
            </span>
          </div>

          {/* Campaign Title */}
          <h3 className="text-base font-black text-white group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
            {campaign.title}
          </h3>

          <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {campaign.description}
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-800/80 space-y-3">
          {/* Budget Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span>Remaining Budget</span>
              <span className="font-extrabold text-white">
                {formatCurrency(campaign.remaining_budget)} / {formatCurrency(campaign.total_budget)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500 shadow-sm shadow-yellow-500/50"
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>
          </div>

          {/* Key Stats Footnote */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-zinc-500" />
              <span>{formatCompactNumber(campaign.total_views_accumulated)} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                {campaign.approved_editors_count}/{campaign.max_editors} editors
              </span>
            </div>
          </div>

          {/* Action Link (Yellow Gradient Button) */}
          <Link
            href={`/c/${campaign.slug}`}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs transition shadow-md shadow-yellow-500/15 active:scale-[0.98]"
          >
            <span>View Campaign</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-950" />
          </Link>
        </div>
      </div>
    </div>
  );
}
