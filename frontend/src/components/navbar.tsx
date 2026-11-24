"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { NotificationsPopover } from "./notifications-popover";
import { PlayCircle, Shield, Video, DollarSign, LayoutDashboard, LogOut } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  // Determine primary dashboard target based on user roles
  const getDashboardLink = () => {
    if (!user) return "/auth/login";
    if (user.roles?.includes("superadmin") || user.selected_role === "superadmin") return "/admin/dashboard";
    if (user.selected_role === "creator") return "/creator/dashboard";
    return "/editor/dashboard";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#090a0f]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center text-zinc-950 shadow-md shadow-yellow-500/25">
              <PlayCircle className="w-5 h-5 fill-zinc-950 text-transparent" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Clip<span className="text-yellow-400">Rewards</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <Link
              href="/c/discover"
              className="hover:text-yellow-400 transition flex items-center gap-1.5"
            >
              <Video className="w-4 h-4 text-zinc-400" /> Discover Campaigns
            </Link>
            {user && (
              <Link
                href={getDashboardLink()}
                className="hover:text-yellow-400 transition flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4 text-zinc-400" /> My Studio
              </Link>
            )}
            {user?.roles?.includes("superadmin") && (
              <Link
                href="/admin/dashboard"
                className="hover:text-yellow-400 transition flex items-center gap-1.5 text-yellow-400 font-semibold"
              >
                <Shield className="w-4 h-4 text-yellow-400" /> Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationsPopover />

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border border-zinc-800 hover:border-yellow-400/50 bg-[#12131a] transition shadow-sm text-zinc-200"
                >
                  <img
                    src={user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                    alt={user.full_name || user.email}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-zinc-200 max-w-[100px] truncate">
                    {user.full_name || user.email.split("@")[0]}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-800 bg-[#12131a] p-2 shadow-2xl z-50 text-zinc-100">
                    <div className="px-3 py-2 border-b border-zinc-800">
                      <p className="text-xs font-bold text-white">{user.full_name || "User"}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
                        {user.selected_role || user.roles[0] || "User"}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href={getDashboardLink()}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white rounded-lg transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                        Dashboard
                      </Link>
                      {user.roles?.includes("editor") && (
                        <Link
                          href="/editor/earnings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white rounded-lg transition"
                        >
                          <DollarSign className="w-4 h-4 text-zinc-400" />
                          My Earnings
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-zinc-800">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-xs font-black text-zinc-950 shadow-md shadow-yellow-500/20 transition active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
