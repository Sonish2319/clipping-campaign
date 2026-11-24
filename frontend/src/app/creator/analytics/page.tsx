"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CreatorAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/analytics/creator")
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-zinc-500">Loading deep analytics...</div>;
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-black text-white">Campaign Analytics & Retention</h1>
        <p className="text-xs text-zinc-400 mt-1">Deep-dive view statistics and editor conversion rates.</p>
      </div>

      {/* Views Timeseries */}
      <div className="p-6 rounded-3xl bg-[#12131a] border border-zinc-800 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-white">7-Day View Growth Trend</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.timeseries || []}>
              <defs>
                <linearGradient id="analyticsYellowLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#22232e" />
              <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={formatCompactNumber} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161722",
                  borderRadius: "12px",
                  border: "1px solid #2e303f",
                  color: "#ffffff",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="url(#analyticsYellowLine)"
                strokeWidth={3}
                dot={{ r: 4, fill: "#facc15" }}
                activeDot={{ r: 6, fill: "#fbbf24" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Timeseries */}
      <div className="p-6 rounded-3xl bg-[#12131a] border border-zinc-800 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-white">Reward Spending vs Performance</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.timeseries || []}>
              <defs>
                <linearGradient id="analyticsYellowBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#22232e" />
              <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161722",
                  borderRadius: "12px",
                  border: "1px solid #2e303f",
                  color: "#ffffff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="spending" fill="url(#analyticsYellowBar)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
