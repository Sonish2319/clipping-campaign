"use client";

import React, { useRef, useState } from "react";
import { ClipCard } from "./clip-card";
import { Submission } from "@/types";
import { ChevronLeft, ChevronRight, Trophy, Maximize2, Minimize2 } from "lucide-react";

interface ClipRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  clips: Submission[];
  loading?: boolean;
}

export function ClipRow({
  title,
  subtitle,
  badge = "Most Viewed",
  clips,
  loading = false,
}: ClipRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    if (!rowRef.current) return;
    const distance = direction === "left" ? -460 : 460;
    rowRef.current.scrollBy({ left: distance, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-6 w-48 bg-zinc-800 animate-pulse rounded-lg" />
            <div className="h-3.5 w-72 bg-zinc-900 animate-pulse rounded-lg" />
          </div>
          <div className="h-9 w-24 bg-zinc-800 animate-pulse rounded-xl" />
        </div>
        <div className="flex gap-5 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-[300px] shrink-0 h-80 bg-[#12131a] border border-zinc-800 animate-pulse rounded-3xl p-4 flex flex-col justify-between"
            >
              <div className="w-full aspect-video bg-zinc-800 rounded-2xl" />
              <div className="space-y-2.5 my-3">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
              <div className="h-9 bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!clips || clips.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Row Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 shadow-sm">
              <Trophy className="w-3 h-3 text-yellow-400" />
              {badge}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Action Controls: Show More / View Mode & Slider Arrows */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle Expand View / Show More row-wise */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              isExpanded
                ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black"
                : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-700/80 hover:border-yellow-400/40 hover:text-yellow-400"
            }`}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Show as Row</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Show More (All {clips.length})</span>
              </>
            )}
          </button>

          {/* Left / Right Slider Controls (only in row mode) */}
          {!isExpanded && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label={`Scroll ${title} left`}
                className="w-8 h-8 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 text-zinc-200 flex items-center justify-center transition shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label={`Scroll ${title} right`}
                className="w-8 h-8 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 text-zinc-200 flex items-center justify-center transition shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row / Grid Content */}
      {isExpanded ? (
        // Expanded Multi-Row Grid View across full page
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 pt-2">
          {clips.map((clip, index) => (
            <ClipCard key={clip.id} clip={clip} rank={index + 1} />
          ))}
        </div>
      ) : (
        // Horizontal Slider Row
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12 2xl:-mx-16 2xl:px-16"
        >
          {clips.map((clip, index) => (
            <div
              key={clip.id}
              className="w-[280px] sm:w-[310px] md:w-[325px] shrink-0 snap-start"
            >
              <ClipCard clip={clip} rank={index + 1} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
