"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CampaignCard } from "@/components/marketplace/campaign-card";
import { Campaign } from "@/types";
import { apiRequest } from "@/lib/api";
import {
  Sparkles,
  Video,
  Scissors,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export default function LandingPage() {
  const [featuredCampaigns, setFeaturedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/campaigns?size=3")
      .then((data) => setFeaturedCampaigns(data.items || []))
      .catch((e) => console.error("Error loading campaigns", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col bg-[#090a0f] text-zinc-100 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#090a0f] via-[#0d0e15] to-[#12131a] py-20 lg:py-28 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Performance Marketplace for YouTube Shorts</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Turn YouTube Clips Into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              Guaranteed Rewards
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Creators fund campaigns to scale their audience. Editors cut viral clips, publish to YouTube, and automatically earn per 1,000 verified views.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/c/discover"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4 text-zinc-950" /> Discover Active Campaigns
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#161722] hover:bg-[#1e1f2e] text-white border border-zinc-800 font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
            >
              <Scissors className="w-4 h-4 text-amber-400" /> Creator & Editor Studio
            </Link>
          </div>

          {/* Metrics bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-zinc-800/80">
            <div>
              <p className="text-3xl font-black text-white">120K+</p>
              <p className="text-xs font-semibold text-zinc-500 mt-1">Verified Views Tracked</p>
            </div>
            <div>
              <p className="text-3xl font-black text-amber-400">$4,000+</p>
              <p className="text-xs font-semibold text-zinc-500 mt-1">Campaign Budget Funded</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">3 Min</p>
              <p className="text-xs font-semibold text-zinc-500 mt-1">Automated View Polling</p>
            </div>
            <div>
              <p className="text-3xl font-black text-amber-400">100%</p>
              <p className="text-xs font-semibold text-zinc-500 mt-1">Verified YouTube API v3</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-[#090a0f] border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">Simple 3-Step Engine</h2>
            <h3 className="text-3xl font-black text-white mt-2">How ClipRewards Works</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-zinc-800 bg-[#12131a] hover:bg-[#161722] hover:border-zinc-700 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center font-black text-lg mb-6">
                1
              </div>
              <h4 className="text-lg font-bold text-white">Creators Post Campaigns</h4>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Creators link their long-form YouTube video, set reward rates (e.g., $2.50 / 1k views), and establish instructions and clip rules.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-zinc-800 bg-[#12131a] hover:bg-[#161722] hover:border-zinc-700 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center font-black text-lg mb-6">
                2
              </div>
              <h4 className="text-lg font-bold text-white">Editors Apply & Clip</h4>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Editors apply with their strategy. Once accepted, they craft high-retention Shorts, publish on their own YouTube channel, and link the video URL.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-zinc-800 bg-[#12131a] hover:bg-[#161722] hover:border-zinc-700 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center font-black text-lg mb-6">
                3
              </div>
              <h4 className="text-lg font-bold text-white">Automated Tracking & Payout</h4>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Our background workers automatically poll official YouTube Data APIs, record snapshot views, and credit earnings to the editor's wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-20 bg-[#0c0d13] border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">Live Opportunities</h2>
              <h3 className="text-3xl font-black text-white mt-1">Featured Campaigns</h3>
            </div>
            <Link
              href="/c/discover"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-400 hover:text-amber-300 transition"
            >
              <span>Explore all campaigns</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCampaigns.map((camp) => (
              <CampaignCard key={camp.id} campaign={camp} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#090a0f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <HelpCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h3 className="text-3xl font-black text-white">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#12131a]">
              <h4 className="font-bold text-base text-white">How are YouTube views verified?</h4>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                We query the official Google YouTube Data API v3 in scheduled batches every 3 minutes. Client-submitted view numbers are never trusted.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#12131a]">
              <h4 className="font-bold text-base text-white">Can an editor submit the same video to multiple campaigns?</h4>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                No. The platform enforces a strict one-to-one unique video constraint to prevent duplicate reward accrual.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#12131a]">
              <h4 className="font-bold text-base text-white">How do reward caps protect creator budgets?</h4>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Creators specify both a maximum reward per editor and an overall total campaign budget. As soon as a cap is reached, additional rewards are held.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
