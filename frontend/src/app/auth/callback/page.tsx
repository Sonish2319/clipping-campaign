"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PlayCircle, AlertCircle, Loader2 } from "lucide-react";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("Authenticating with Google...");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`Google returned an error: ${errorParam}`);
      return;
    }

    if (!code) {
      setError("No authorization code provided by Google.");
      return;
    }

    const exchangeCode = async () => {
      try {
        setStatusText("Exchanging code for platform session...");
        const origin = typeof window !== "undefined" && window.location.origin.includes("127.0.0.1")
          ? "http://localhost:3000"
          : window.location.origin;
        const redirectUri = `${origin}/auth/callback`;

        const res = await apiRequest("/auth/google/callback", {
          method: "POST",
          body: JSON.stringify({
            code: code,
            redirect_uri: redirectUri,
          }),
        });

        login(res.access_token, res);

        if (res.needs_onboarding) {
          router.push("/auth/onboarding");
        } else if (res.roles.includes("superadmin") || res.selected_role === "superadmin") {
          router.push("/admin/dashboard");
        } else if (res.selected_role === "creator") {
          router.push("/creator/dashboard");
        } else {
          router.push("/editor/dashboard");
        }
      } catch (err: any) {
        console.error("OAuth callback error", err);
        setError(err.message || "Failed to complete Google authentication.");
      }
    };

    exchangeCode();
  }, [searchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-zinc-100">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#12131a] p-8 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
          <PlayCircle className="w-6 h-6 fill-zinc-950 text-transparent" />
        </div>

        {error ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-400 flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 text-xs font-black shadow-md transition"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">{statusText}</h3>
            <p className="text-xs text-zinc-400">Please wait while we verify your Google credentials...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
