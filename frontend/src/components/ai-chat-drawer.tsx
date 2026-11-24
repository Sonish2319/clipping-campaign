"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User as UserIcon,
  Loader2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: string;
}

const SUGGESTION_PROMPTS = [
  "Show active campaigns with high reward rates",
  "What are the video duration and format rules?",
  "How are views verified and calculated?",
  "Can I use sound effects and kinetic captions?",
];

export function AIChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Welcome to **ClipRewards AI**! I can help you discover high-paying campaigns, verify editing guidelines, check platform policies, or track submission requirements. What would you like to know?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    setInput("");
    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `assistant_${Date.now()}`;

    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, role: "user", content: textToSend },
      { id: assistantMsgId, role: "assistant", content: "" },
    ];

    setMessages(newMessages);
    setLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

      const historyPayload = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("No readable stream response");

      let accumulated = "";
      let currentStatus: string | undefined = undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.replace("data: ", "").trim();

          try {
            const data = jsonParseSafe(dataStr);
            if (!data) continue;

            if (data.type === "token") {
              accumulated += data.content;
              currentStatus = undefined;
              updateAssistantMessage(assistantMsgId, accumulated, currentStatus);
            } else if (data.type === "status") {
              currentStatus = data.content;
              updateAssistantMessage(assistantMsgId, accumulated, currentStatus);
            } else if (data.type === "error") {
              accumulated += `\n\n❌ ${data.content}`;
              updateAssistantMessage(assistantMsgId, accumulated, undefined);
            }
          } catch {
            // Ignore malformed chunk
          }
        }
      }
    } catch (err: any) {
      updateAssistantMessage(
        assistantMsgId,
        `⚠️ Failed to connect to AI engine: ${err.message || "Network error"}. Please ensure the backend is running.`,
        undefined
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAssistantMessage = (id: string, content: string, status?: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, status } : m))
    );
  };

  const handleClear = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Chat cleared! Ask me anything about active campaigns, video rules, or reward rates.",
      },
    ]);
  };

  // Simple Markdown & Link Renderer
  const renderFormattedContent = (content: string) => {
    // Replace [Title](/path) with clickable links
    const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);

    return parts.map((part, index) => {
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [, linkText, linkHref] = linkMatch;
        return (
          <Link
            key={index}
            href={linkHref}
            className="text-amber-400 hover:text-amber-300 underline font-bold inline-flex items-center gap-0.5 mx-0.5"
            onClick={() => setIsOpen(false)}
          >
            {linkText}
            <ExternalLink className="w-3 h-3 inline" />
          </Link>
        );
      }

      // Convert **bold** tags
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={index}>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith("**") && bPart.endsWith("**")) {
              return (
                <strong key={bIdx} className="font-extrabold text-white">
                  {bPart.slice(2, -2)}
                </strong>
              );
            }
            return <span key={bIdx}>{bPart}</span>;
          })}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 hover:scale-105 active:scale-95 text-zinc-950 font-black shadow-2xl shadow-amber-500/30 transition-all flex items-center justify-center group"
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 stroke-[2.5]" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-pulse" />
          </div>
        )}
      </button>

      {/* Floating Chat Drawer Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-3xl border border-zinc-800 bg-[#12131a] shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Drawer Header */}
          <div className="px-5 py-4 bg-[#090a0f] border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-zinc-950 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Bot className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>ClipRewards AI</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold uppercase">
                    RAG
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400">Policies, Campaigns & Live Leaderboard</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-[#1c1d2c] text-white border border-zinc-700/80 rounded-br-none"
                      : "bg-[#0c0d13] text-zinc-200 border border-zinc-800/90 rounded-bl-none shadow-sm"
                  }`}
                >
                  {m.status && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold mb-2 pb-1.5 border-b border-zinc-800 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{m.status}</span>
                    </div>
                  )}

                  <div>{renderFormattedContent(m.content)}</div>
                </div>

                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && !messages[messages.length - 1]?.content && !messages[messages.length - 1]?.status && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs pl-9">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-zinc-800/80 bg-[#090a0f]/40 flex gap-1.5 overflow-x-auto scrollbar-none">
              {SUGGESTION_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-xl bg-[#161722] hover:bg-[#1f2030] border border-zinc-800 hover:border-amber-400/40 text-[11px] text-zinc-300 font-medium whitespace-nowrap transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-[#090a0f] border-t border-zinc-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about campaigns, editing rules, payouts..."
                disabled={loading}
                className="flex-1 p-2.5 text-xs rounded-xl border border-zinc-700 bg-[#161722] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-zinc-950 font-black shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:hover:from-amber-400 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function jsonParseSafe(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
