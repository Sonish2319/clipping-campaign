"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Campaign } from "@/types";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Play,
  ArrowRight,
  Eye,
  ShieldCheck,
} from "lucide-react";

interface FeaturedCampaignCarouselProps {
  campaigns: Campaign[];
  loading?: boolean;
}

export function FeaturedCampaignCarousel({
  campaigns,
  loading = false,
}: FeaturedCampaignCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = campaigns.length;

  const nextSlide = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (total <= 1 || isPaused || loading) return;

    timerRef.current = setInterval(nextSlide, 5500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, loading, currentIndex]);

  if (loading) {
    return (
      <div className="w-full rounded-3xl bg-[#12131a] border border-zinc-800 p-8 sm:p-12 animate-pulse min-h-[380px] flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 bg-zinc-800 rounded-full" />
          <div className="h-6 w-20 bg-zinc-800 rounded-full" />
        </div>
        <div className="space-y-4 my-6">
          <div className="h-8 bg-zinc-800 rounded-xl w-3/4 max-w-xl" />
          <div className="h-4 bg-zinc-800 rounded-lg w-1/2" />
        </div>
        <div className="flex gap-4">
          <div className="h-12 w-36 bg-zinc-800 rounded-2xl" />
          <div className="h-12 w-36 bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return null;
  }

  const current = campaigns[currentIndex];
  const budgetSpent = current.total_budget - current.remaining_budget;
  const progressPercent = Math.min(
    100,
    Math.round((budgetSpent / (current.total_budget || 1)) * 100)
  );

  return (
    <div
      className="relative group w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Outer Card with Matte Black Styling and Subtle Amber/Yellow Glow */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c0d12] via-[#101118] to-[#161722] border border-zinc-800/90 shadow-2xl">
        {/* Subtle Background Glow Accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Carousel Content */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[390px]">
          {/* Left Column: Metadata & Action */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 shadow-sm backdrop-blur">
                  <Flame className="w-3.5 h-3.5 fill-yellow-400 text-transparent animate-pulse" />
                  Featured & Trending
                </span>

                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 backdrop-blur">
                  {current.category}
                </span>

                {current.total_views_accumulated > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-800/80 text-zinc-300 border border-zinc-700/80">
                    <Eye className="w-3 h-3 text-yellow-400" />
                    {formatCompactNumber(current.total_views_accumulated)} Views
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight line-clamp-2">
                {current.title}
              </h2>

              {/* Creator details */}
              <div className="flex items-center gap-2.5 mt-2.5">
                <img
                  src={
                    current.creator?.avatar_url ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                  }
                  alt={current.creator?.full_name || "Creator"}
                  className="w-6 h-6 rounded-full object-cover ring-2 ring-zinc-700"
                />
                <span className="text-xs font-semibold text-zinc-300">
                  {current.creator?.full_name || "Verified Creator"}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/30">
                  <ShieldCheck className="w-3 h-3" /> Partner
                </span>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed max-w-xl">
                {current.description}
              </p>
            </div>

            {/* Campaign Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1">
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                  Reward Rate
                </span>
                <div className="text-yellow-400 font-black text-sm sm:text-base leading-none">
                  {formatCurrency(current.reward_per_1000_views)}
                  <span className="text-[10px] font-medium text-yellow-300/80 ml-0.5">/1k views</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                  Remaining Budget
                </span>
                <div className="text-white font-black text-sm sm:text-base leading-none">
                  {formatCurrency(current.remaining_budget)}
                </div>
                <div className="mt-1.5 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
                    style={{ width: `${100 - progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                  Max / Editor
                </span>
                <div className="text-white font-black text-sm sm:text-base leading-none">
                  {formatCurrency(current.max_reward_per_editor)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                  Clip Duration
                </span>
                <div className="text-white font-black text-sm sm:text-base leading-none">
                  {current.min_clip_duration_sec}s - {current.max_clip_duration_sec}s
                </div>
              </div>
            </div>

            {/* CTAs (Yellow Gradient Button) */}
            <div className="flex items-center gap-4 pt-1">
              <Link
                href={`/c/${current.slug}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-xl shadow-yellow-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>View Campaign</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </Link>

              <span className="text-[11px] text-zinc-400 font-medium">
                {current.approved_editors_count} of {current.max_editors} editor spots filled
              </span>
            </div>
          </div>

          {/* Right Column: Visual Preview Card */}
          <div className="lg:col-span-5 w-full flex items-center justify-center">
            <Link
              href={`/c/${current.slug}`}
              className="relative aspect-video w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-black group/preview transition transform hover:scale-[1.02] duration-300 block"
            >
              <img
                src={
                  current.thumbnail_url ||
                  `https://img.youtube.com/vi/${current.original_video_id}/hqdefault.jpg`
                }
                alt={current.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-105 opacity-90 group-hover:opacity-100"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                {/* Play Badge */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 group-hover/preview:scale-110 transition duration-300">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-transparent ml-1" />
                </div>
              </div>

              {/* Bottom Video Chip */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
                <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur font-semibold line-clamp-1 border border-white/10">
                  Original YouTube Video
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-yellow-400 text-zinc-950 font-black backdrop-blur">
                  Click to Explore
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation Arrows */}
        {total > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous Campaign"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition opacity-80 hover:opacity-100 z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next Campaign"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition opacity-80 hover:opacity-100 z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Carousel Indicators Bar */}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
            {campaigns.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? "w-7 h-2 bg-gradient-to-r from-amber-400 to-yellow-400 shadow-sm shadow-yellow-500"
                    : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
