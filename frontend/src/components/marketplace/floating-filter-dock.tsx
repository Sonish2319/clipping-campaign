"use client";

import React from "react";
import { Search, X, Tag, ArrowUpDown, RotateCcw } from "lucide-react";

interface FloatingFilterDockProps {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  totalCount: number;
  categories: string[];
  sortOptions: { label: string; value: string }[];
  onReset?: () => void;
}

export function FloatingFilterDock({
  search,
  setSearch,
  category,
  setCategory,
  sortBy,
  setSortBy,
  totalCount,
  categories,
  sortOptions,
  onReset,
}: FloatingFilterDockProps) {
  const hasActiveFilters = search.trim() !== "" || category !== "All" || sortBy !== "newest";

  return (
    <aside
      aria-label="Campaign filters and search"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] sm:w-auto max-w-4xl transition-all duration-300"
    >
      <div className="bg-[#0e0f16]/95 text-white backdrop-blur-2xl border border-zinc-800/90 shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl sm:rounded-full p-2.5 sm:px-4 sm:py-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1 w-full sm:w-72 sm:min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campaigns, games, creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-900/90 hover:bg-zinc-800/90 focus:bg-zinc-900 text-white placeholder-zinc-500 rounded-xl sm:rounded-full border border-zinc-800 focus:border-yellow-400/60 focus:outline-none transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search query"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters Group (Category + Sort) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {/* Category Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <div className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl sm:rounded-full border border-zinc-800 transition">
              <Tag className="w-3 h-3 text-yellow-400 shrink-0" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
                className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none cursor-pointer pr-1"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-white">
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <div className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl sm:rounded-full border border-zinc-800 transition">
              <ArrowUpDown className="w-3 h-3 text-yellow-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort campaigns by"
                className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none cursor-pointer pr-1"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter & Reset */}
        <div className="hidden md:flex items-center gap-2 pl-1 border-l border-zinc-800 shrink-0">
          <span className="text-[11px] font-bold text-zinc-300 whitespace-nowrap flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            {totalCount} Active
          </span>

          {hasActiveFilters && onReset && (
            <button
              onClick={onReset}
              title="Reset all filters"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 text-yellow-400 text-[11px] font-bold transition ml-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
