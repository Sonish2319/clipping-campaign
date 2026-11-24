"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, Scissors, Check, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { switchRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"creator" | "editor">("editor");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await apiRequest("/auth/onboarding/role", {
        method: "POST",
        body: JSON.stringify({ role: selectedRole }),
      });

      if (res.access_token) {
        localStorage.setItem("token", res.access_token);
      }
      switchRole(selectedRole);

      if (selectedRole === "creator") {
        router.push("/creator/dashboard");
      } else {
        router.push("/editor/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 text-zinc-100">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-[#12131a] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to ClipRewards</span>
          </div>
          <h2 className="text-2xl font-black text-white">Choose Your Account Type</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Select how you would like to participate in the marketplace. You can support dual capabilities later.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Creator Choice */}
          <div
            onClick={() => setSelectedRole("creator")}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition relative flex flex-col justify-between ${
              selectedRole === "creator"
                ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/10"
                : "border-zinc-800 hover:border-zinc-700 bg-[#161722]"
            }`}
          >
            {selectedRole === "creator" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">YouTube Creator</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                I own a YouTube channel and want to fund campaigns for editors to create viral Shorts from my videos.
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-400 mt-4 block">
              Access Creator Studio →
            </span>
          </div>

          {/* Editor Choice */}
          <div
            onClick={() => setSelectedRole("editor")}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition relative flex flex-col justify-between ${
              selectedRole === "editor"
                ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/10"
                : "border-zinc-800 hover:border-zinc-700 bg-[#161722]"
            }`}
          >
            {selectedRole === "editor" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center mb-4">
                <Scissors className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">Editor / Campaigner</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                I discover campaigns, craft viral clips, publish to YouTube, and earn performance rewards per 1,000 views.
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-400 mt-4 block">
              Access Editor Hub →
            </span>
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={submitting}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
        >
          <span>{submitting ? "Setting up account..." : `Continue as ${selectedRole === "creator" ? "Creator" : "Editor"}`}</span>
          <ArrowRight className="w-4 h-4 text-zinc-950" />
        </button>
      </div>
    </div>
  );
}
