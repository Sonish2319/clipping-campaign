"use client";

import React from "react";
import Link from "next/link";
import { Submission } from "@/types";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { Play, Eye, ExternalLink, Trophy, Youtube, DollarSign } from "lucide-react";

interface ClipCardProps {
  clip: Submission;
  rank?: number;
}

export function ClipCard({ clip, rank }: ClipCardProps) {
  const earnings = clip.approved_earnings > 0 ? clip.approved_earnings : clip.estimated_earnings;
  const videoTitle = clip.video?.title || `Clip #${clip.youtube_video_id}`;
  const thumbnailUrl =
    clip.video?.thumbnail_url || `https://img.youtube.com/vi/${clip.youtube_video_id}/hqdefault.jpg`;

  return (
    <div className="group flex flex-col rounded-3xl border border-zinc-800/90 bg-[#12131a] shadow-md hover:shadow-2xl hover:border-yellow-400/40 transition-all duration-300 overflow-hidden h-full justify-between">
      <div>
        {/* Thumbnail Preview Area */}
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <img
            src={thumbnailUrl}
            alt={videoTitle}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />

          {/* Dark Overlay with Play Action */}
          <a
            href={clip.youtube_url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Watch ${videoTitle} on YouTube`}
            className="absolute inset-0 bg-black/40 hover:bg-black/20 transition flex items-center justify-center group/play"
          >
            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/40 group-hover/play:scale-110 transition duration-300">
              <Play className="w-5 h-5 fill-white text-transparent ml-0.5" />
            </div>
          </a>

          {/* Rank Badge */}
          {rank !== undefined && (
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md backdrop-blur ${
                  rank === 1
                    ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black ring-2 ring-yellow-300"
                    : rank === 2
                    ? "bg-zinc-200 text-zinc-950 font-black ring-2 ring-zinc-300"
                    : rank === 3
                    ? "bg-amber-700 text-white font-black ring-2 ring-amber-600"
                    : "bg-black/80 text-white border border-white/20"
                }`}
              >
                {rank <= 3 && <Trophy className="w-3 h-3" />}
                <span>#{rank}</span>
              </span>
            </div>
          )}

          {/* Views Pill */}
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-black/80 text-white border border-white/10 shadow-md backdrop-blur">
              <Eye className="w-3 h-3 text-yellow-400" />
              <span>{formatCompactNumber(clip.current_views)}</span>
            </span>
          </div>

          {/* Duration Badge */}
          {clip.video?.duration_seconds ? (
            <div className="absolute bottom-3 right-3">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/90 text-white backdrop-blur">
                {clip.video.duration_seconds}s
              </span>
            </div>
          ) : null}
        </div>

        {/* Content Details */}
        <div className="p-4 space-y-3">
          {/* Channel / Editor Info */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Youtube className="w-4 h-4 text-red-500 shrink-0" />
              <span className="font-semibold text-zinc-300 truncate text-[11px]">
                {clip.video?.channel_title || clip.editor?.full_name || "Verified Editor"}
              </span>
            </div>

            {/* Earnings Pill */}
            {earnings > 0 && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 shrink-0">
                <DollarSign className="w-2.5 h-2.5" />
                <span>{formatCurrency(earnings)}</span>
              </span>
            )}
          </div>

          {/* Video Title */}
          <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
            {videoTitle}
          </h3>

          {/* Parent Campaign Link */}
          {clip.campaign && (
            <div className="pt-1 text-[11px] text-zinc-400 flex items-center gap-1">
              <span className="text-zinc-500 shrink-0">Campaign:</span>
              <Link
                href={`/c/${clip.campaign.slug}`}
                className="font-semibold text-yellow-400/90 hover:text-yellow-300 hover:underline truncate"
              >
                {clip.campaign.title}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <a
          href={clip.youtube_url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition border border-zinc-700/60"
        >
          <Youtube className="w-3.5 h-3.5 text-red-500" />
          <span>Watch</span>
          <ExternalLink className="w-3 h-3 text-zinc-400" />
        </a>

        {clip.campaign && (
          <Link
            href={`/c/${clip.campaign.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs transition shadow-sm"
          >
            <span>Campaign</span>
          </Link>
        )}
      </div>
    </div>
  );
}
