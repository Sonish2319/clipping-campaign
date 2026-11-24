"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import { Shield, Sparkles, UserCheck, PlayCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePasswordLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      login(res.access_token, res);

      if (res.roles.includes("superadmin")) {
        router.push("/admin/dashboard");
      } else if (res.selected_role === "creator") {
        router.push("/creator/dashboard");
      } else {
        router.push("/editor/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const origin = typeof window !== "undefined" && window.location.origin.includes("127.0.0.1")
        ? "http://localhost:3000"
        : window.location.origin;
      const redirectUri = `${origin}/auth/callback`;

      const res = await apiRequest(`/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("Did not receive authorization URL from server.");
      }
    } catch (err: any) {
      setError(err.message || "Could not initiate Google authentication.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 text-zinc-100">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#12131a] p-8 shadow-2xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <PlayCircle className="w-6 h-6 fill-zinc-950 text-transparent" />
          </div>
          <h2 className="text-2xl font-black text-white">Welcome to ClipRewards</h2>
          <p className="mt-1 text-xs text-zinc-400">Sign in to manage campaigns and track rewards</p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Real Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full mt-6 flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-zinc-700 bg-[#161722] hover:bg-[#1f2030] text-zinc-100 text-xs font-bold shadow-sm transition"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{googleLoading ? "Redirecting to Google..." : "Continue with Google"}</span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative bg-[#12131a] px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Or Demo Account Quick Switch
          </span>
        </div>

        {/* Demo Fast Logins (Preserved as requested) */}
        <div className="space-y-2">
          <button
            onClick={() => handlePasswordLogin("admin@campaignmarketplace.com", "AdminSecretPass123!")}
            className="w-full p-2.5 rounded-xl border border-purple-800/50 bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 text-xs font-bold flex items-center justify-between transition"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Login as Superadmin</span>
            </div>
            <span className="text-[10px] text-purple-400 font-normal">Full Governance</span>
          </button>

          <button
            onClick={() => handlePasswordLogin("creator@apexvisuals.com", "CreatorPass123!")}
            className="w-full p-2.5 rounded-xl border border-amber-800/50 bg-amber-950/30 hover:bg-amber-900/40 text-amber-200 text-xs font-bold flex items-center justify-between transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Login as Creator (Apex Visuals)</span>
            </div>
            <span className="text-[10px] text-amber-400 font-normal">Campaign Creator</span>
          </button>

          <button
            onClick={() => handlePasswordLogin("alex.editor@viralclips.io", "EditorPass123!")}
            className="w-full p-2.5 rounded-xl border border-emerald-800/50 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200 text-xs font-bold flex items-center justify-between transition"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Login as Editor (Viral Clips)</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-normal">Clip Submissions & Earnings</span>
          </button>
        </div>

        {/* Custom Email / Password Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePasswordLogin(email, password);
          }}
          className="mt-6 pt-6 border-t border-zinc-800 space-y-3"
        >
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full p-2 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2 text-xs rounded-xl border border-zinc-700 bg-[#181926] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs transition shadow-lg shadow-amber-500/20"
          >
            {loading ? "Signing in..." : "Sign in with Credentials"}
          </button>
        </form>
      </div>
    </div>
  );
}
