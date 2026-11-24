"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Users,
  Video,
  FileText,
  Compass,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview", icon: Shield },
  { href: "/admin/discover", label: "Discover Campaigns", icon: Compass },
  { href: "/admin/campaigns", label: "Campaign Moderation", icon: Video },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  { href: "/admin/jobs", label: "System Jobs", icon: Cpu },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#090a0f] text-zinc-100">
      {/* Sticky, Collapsible Sidebar */}
      <aside
        className={`sticky top-16 h-[calc(100vh-64px)] shrink-0 z-30 border-r border-zinc-800/80 bg-[#0c0d12] flex flex-col justify-between transition-all duration-300 ease-in-out hidden md:flex ${
          collapsed ? "w-20 p-3" : "w-64 p-5"
        }`}
      >
        <div>
          {/* Header Row & Collapse Toggle */}
          <div className="flex items-center justify-between mb-6 px-1">
            {!collapsed && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                  Superadmin
                </span>
                <p className="text-xs font-bold text-white mt-0.5">Platform Governance</p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`p-1.5 rounded-xl border border-zinc-800 hover:border-yellow-400/50 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 transition ${
                collapsed ? "mx-auto" : ""
              }`}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    collapsed ? "justify-center" : ""
                  } ${
                    active
                      ? "bg-gradient-to-r from-amber-400/20 via-yellow-400/15 to-transparent text-yellow-400 border border-yellow-400/30 shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? "text-yellow-400" : "text-zinc-400"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info or quick indicator */}
        <div className="border-t border-zinc-800/80 pt-3">
          {!collapsed ? (
            <div className="flex items-center gap-2 px-2 text-[11px] text-zinc-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Health 100%</span>
            </div>
          ) : (
            <div className="flex justify-center" title="System Health 100%">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
