"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/admin/audit-logs?limit=50")
      .then((data) => setLogs(data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-white">Immutable Audit Logs</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Cryptographically recorded security and moderation event trail.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-[#12131a] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161722] border-b border-zinc-800 text-[11px] font-bold uppercase text-zinc-400">
            <tr>
              <th className="p-4">Action</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Resource</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-zinc-400">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-zinc-400">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#161722]/50 transition">
                  <td className="p-4 font-bold text-white">
                    <span className="px-2.5 py-1 rounded-md bg-[#161722] border border-zinc-700 font-mono text-[10px] text-amber-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-300">
                    User #{log.actor_user_id || "System"}
                  </td>
                  <td className="p-4 text-zinc-400 font-mono text-[11px]">
                    {log.target_type} #{log.target_id}
                  </td>
                  <td className="p-4 text-zinc-500 text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
