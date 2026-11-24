"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Wallet } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, CheckCircle2 } from "lucide-react";

export default function EditorEarningsPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/analytics/editor")
      .then((data) => {
        setWallet({
          id: 1,
          user_id: 1,
          estimated_balance: data.estimated_earnings || 0,
          available_balance: data.approved_earnings || 0,
          total_paid_out: 0,
          currency: "USD",
          updated_at: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-8 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-white">Wallet & Earnings Ledger</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Simulated wallet balance and immutable reward audit trail.
        </p>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-[#161722] to-[#12131a] border border-amber-400/30 text-white shadow-xl shadow-amber-500/5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Estimated Accrued
          </span>
          <p className="text-3xl font-black mt-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
            {formatCurrency(wallet?.estimated_balance || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Accumulated from verified views
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Approved / Available
          </span>
          <p className="text-3xl font-black text-white mt-2">
            {formatCurrency(wallet?.available_balance || 0)}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            Ready for payout simulation
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[#12131a] border border-zinc-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Total Paid Out
          </span>
          <p className="text-3xl font-black text-white mt-2">
            {formatCurrency(wallet?.total_paid_out || 0)}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            Historic lifetime payout
          </span>
        </div>
      </div>

      {/* Simulated Ledger Table */}
      <div className="bg-[#12131a] p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-white">Transaction History</h3>
        <div className="divide-y divide-zinc-800/80 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold">
                +
              </div>
              <div>
                <p className="font-bold text-white">Accrual: Minecraft Hardcore Jumpscare</p>
                <span className="text-[10px] text-zinc-400">Milestone: 42,000 verified views reached</span>
              </div>
            </div>
            <span className="font-extrabold text-amber-400 text-sm">+$105.00</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="font-bold text-white">Creator Approval Confirmation</p>
                <span className="text-[10px] text-zinc-400">Confirmed by Apex Visuals</span>
              </div>
            </div>
            <span className="font-semibold text-zinc-400 text-xs">Confirmed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
