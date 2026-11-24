"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CampaignCard } from "@/components/marketplace/campaign-card";
import { FeaturedCampaignCarousel } from "@/components/marketplace/featured-carousel";
import { FloatingFilterDock } from "@/components/marketplace/floating-filter-dock";
import { CampaignRow } from "@/components/marketplace/campaign-row";
import { ClipRow } from "@/components/marketplace/clip-row";
import { Campaign, Submission } from "@/types";
import { apiRequest } from "@/lib/api";
import { Sparkles, Flame, Layers, Loader2, CheckCircle2 } from "lucide-react";

const CATEGORIES = ["All", "Gaming", "Technology", "Entertainment", "Education"];
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Highest Reward", value: "highest_reward" },
  { label: "Highest Budget", value: "highest_budget" },
  { label: "Most Popular", value: "most_popular" },
];

const PAGE_SIZE = 18;

interface DiscoverMarketplaceViewProps {
  embeddedInPanel?: boolean;
}

export function DiscoverMarketplaceView({ embeddedInPanel = false }: DiscoverMarketplaceViewProps) {
  // Top Hero Carousel State
  const [featuredCampaigns, setFeaturedCampaigns] = useState<Campaign[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // Row 1: Trending Campaigns
  const [trendingCampaigns, setTrendingCampaigns] = useState<Campaign[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Row 2: Recent Campaigns
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // Row 3: Top Clips (Ordered by most views)
  const [topClips, setTopClips] = useState<Submission[]>([]);
  const [topClipsLoading, setTopClipsLoading] = useState(true);

  // Section 4: All Campaigns (Infinite Scrolling)
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters (controlled via floating dock & top pills)
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Sentinel observer ref for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch Top Hero Featured Campaigns (once on mount)
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setFeaturedLoading(true);
        const res = await apiRequest("/campaigns?status=active&sort_by=highest_reward&size=5");
        setFeaturedCampaigns(res.items || []);
      } catch (err) {
        console.error("Failed to load featured campaigns", err);
      } finally {
        setFeaturedLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // 2. Fetch Trending This Week row (once on mount)
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setTrendingLoading(true);
        const res = await apiRequest("/campaigns?status=active&sort_by=most_popular&size=15");
        setTrendingCampaigns(res.items || []);
      } catch (err) {
        console.error("Failed to load trending campaigns", err);
      } finally {
        setTrendingLoading(false);
      }
    };
    fetchTrending();
  }, []);

  // 3. Fetch New Campaigns row (once on mount)
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setRecentLoading(true);
        const res = await apiRequest("/campaigns?status=active&sort_by=newest&size=15");
        setRecentCampaigns(res.items || []);
      } catch (err) {
        console.error("Failed to load recent campaigns", err);
      } finally {
        setRecentLoading(false);
      }
    };
    fetchRecent();
  }, []);

  // 4. Fetch Top Clips row ordered by views (once on mount)
  useEffect(() => {
    const fetchTopClips = async () => {
      try {
        setTopClipsLoading(true);
        const res = await apiRequest("/submissions/top?limit=15");
        setTopClips(res || []);
      } catch (err) {
        console.error("Failed to load top clips", err);
      } finally {
        setTopClipsLoading(false);
      }
    };
    fetchTopClips();
  }, []);

  // 5. Fetch All Campaigns (Initial page 1 fetch when filters change)
  const fetchAllCampaignsInitial = async () => {
    setInitialLoading(true);
    setPage(1);
    try {
      const params = new URLSearchParams({
        status: "active",
        sort_by: sortBy,
        page: "1",
        size: String(PAGE_SIZE),
      });
      if (search.trim()) params.append("search", search.trim());
      if (category !== "All") params.append("category", category);

      const res = await apiRequest(`/campaigns?${params.toString()}`);
      const items: Campaign[] = res.items || [];
      setAllCampaigns(items);
      setTotalCount(res.total || 0);
      setHasMore(items.length < (res.total || 0));
    } catch (e) {
      console.error("Failed to load initial campaigns", e);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchAllCampaignsInitial, 300);
    return () => clearTimeout(timer);
  }, [search, category, sortBy]);

  // 6. Fetch More for Infinite Scroll
  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({
        status: "active",
        sort_by: sortBy,
        page: String(nextPage),
        size: String(PAGE_SIZE),
      });
      if (search.trim()) params.append("search", search.trim());
      if (category !== "All") params.append("category", category);

      const res = await apiRequest(`/campaigns?${params.toString()}`);
      const newItems: Campaign[] = res.items || [];

      setAllCampaigns((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const filteredNew = newItems.filter((c) => !existingIds.has(c.id));
        const combined = [...prev, ...filteredNew];
        setHasMore(combined.length < (res.total || 0));
        return combined;
      });
      setPage(nextPage);
    } catch (e) {
      console.error("Failed to load more campaigns", e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, sortBy, search, category]);

  // 7. Setup Intersection Observer for Infinite Scroll Sentinel
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading) {
          loadNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, initialLoading, loadNextPage]);

  const handleResetFilters = () => {
    setSearch("");
    setCategory("All");
    setSortBy("newest");
  };

  return (
    <div className={`min-h-screen bg-[#090a0f] text-zinc-100 ${embeddedInPanel ? "pb-36" : "pb-44"}`}>
      {/* Full-width container */}
      <div className={`w-full ${embeddedInPanel ? "px-2 sm:px-4 md:px-6 py-6" : "px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16 pt-6 sm:pt-8"} space-y-12`}>
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Creator Campaign Marketplace
            </h1>
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-3xl">
              Browse creator campaigns, produce viral clips and Shorts, and earn guaranteed payouts per 1,000 views.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-bold text-zinc-200 bg-[#12131a] px-4 py-2.5 rounded-2xl border border-zinc-800 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
            <span>{totalCount} Opportunities Live</span>
          </div>
        </div>

        {/* Hero Section: Sliding Carousel with Campaign Metadata */}
        <section aria-label="Featured Highlight">
          <FeaturedCampaignCarousel
            campaigns={featuredCampaigns}
            loading={featuredLoading}
          />
        </section>

        {/* Section 1: Trending This Week Row */}
        <CampaignRow
          title="Trending This Week"
          subtitle="Top performing campaigns with high viral engagement and fast reward velocity"
          badge="High Velocity"
          icon={<Flame className="w-3 h-3 text-yellow-400" />}
          campaigns={trendingCampaigns}
          loading={trendingLoading}
        />

        {/* Section 2: New & Recent Campaigns Row */}
        <CampaignRow
          title="New & Recently Added"
          subtitle="Fresh creator campaigns just launched — early editor spots open now"
          badge="Just Added"
          icon={<Sparkles className="w-3 h-3 text-yellow-400" />}
          campaigns={recentCampaigns}
          loading={recentLoading}
        />

        {/* Section 3: Top Viral Clips Row (Ordered by most views) */}
        <ClipRow
          title="Top Viral Clips"
          subtitle="Highest performing YouTube clips and Shorts created by platform editors, ranked by total verified views"
          badge="Most Viewed"
          clips={topClips}
          loading={topClipsLoading}
        />

        {/* Section 4: All Campaigns Directory (Infinite Scrolling Grid) */}
        <section className="space-y-6 pt-4">
          {/* Header & Category Pills */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 shadow-sm">
                  <Layers className="w-3 h-3 text-yellow-400" />
                  Full Directory
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  All Campaigns
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Explore all active campaigns sorted by recent additions with automatic infinite scrolling.
              </p>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    category === cat
                      ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black shadow-md shadow-yellow-500/15 scale-105"
                      : "bg-[#12131a] text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Campaign Cards - Full Page Width */}
          {initialLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-3xl border border-zinc-800 bg-[#12131a] animate-pulse p-4 flex flex-col justify-between shadow-sm"
                >
                  <div className="w-full aspect-video bg-zinc-800 rounded-2xl" />
                  <div className="space-y-3 my-4">
                    <div className="h-5 bg-zinc-800 rounded-xl w-3/4" />
                    <div className="h-3.5 bg-zinc-800 rounded-lg w-1/2" />
                  </div>
                  <div className="h-10 bg-zinc-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : allCampaigns.length === 0 ? (
            <div className="py-24 text-center rounded-3xl border border-dashed border-zinc-800 bg-[#12131a] shadow-sm p-8">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-yellow-400 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-white">No campaigns found</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {search
                  ? `No campaigns match "${search}". Try clearing your search query or selecting a different category.`
                  : "No active campaigns currently in this category."}
              </p>
              {(search || category !== "All" || sortBy !== "newest") && (
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-md transition"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Full-width Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                {allCampaigns.map((camp) => (
                  <CampaignCard key={camp.id} campaign={camp} />
                ))}
              </div>

              {/* Infinite Scrolling Sentinel & Loading Indicators */}
              <div
                ref={loadMoreRef}
                className="py-10 flex flex-col items-center justify-center w-full min-h-[80px]"
              >
                {loadingMore && (
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200 bg-[#12131a] px-5 py-3 rounded-2xl border border-zinc-800 shadow-md">
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    <span>Loading more creator campaigns...</span>
                  </div>
                )}

                {!hasMore && allCampaigns.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 py-4">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                    <span>You have reached the end of all active campaigns ({allCampaigns.length} total)</span>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Floating Sticky Bottom-Center Search & Filter Bar */}
      <FloatingFilterDock
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        totalCount={totalCount}
        categories={CATEGORIES}
        sortOptions={SORT_OPTIONS}
        onReset={handleResetFilters}
      />
    </div>
  );
}
