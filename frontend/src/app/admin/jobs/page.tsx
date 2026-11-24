"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Cpu, CheckCircle2 } from "lucide-react";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/admin/jobs")
      .then((data) => setJobs(data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-white">Background Tasks & Workers</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Monitor scheduled Celery batch poller jobs, execution cycles, and task queues.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400 col-span-3">Loading background jobs...</div>
        ) : (
          jobs.map((j) => (
            <div key={j.name} className="p-6 rounded-3xl bg-[#12131a] border border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5 text-amber-400" />
                </div>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Healthy</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{j.name}</h4>
                <p className="text-xs text-zinc-400 mt-1">Schedule: {j.schedule}</p>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span>Processed Tasks:</span>
                <strong className="text-amber-400">{j.total_tasks_processed}</strong>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
