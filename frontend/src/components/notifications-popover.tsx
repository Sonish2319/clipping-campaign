"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Notification } from "@/types";

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const countRes = await apiRequest("/notifications/unread-count");
      setUnreadCount(countRes.unread_count || 0);

      const items = await apiRequest("/notifications");
      setNotifications(items || []);
    } catch (e) {
      // Ignored if unauthenticated
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // 20s poll
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await apiRequest("/notifications/read", {
        method: "POST",
        body: JSON.stringify({ notification_ids: unreadIds }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-amber-400 rounded-full hover:bg-[#161722] transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-zinc-950 shadow-sm shadow-amber-500/50">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-800 bg-[#12131a] p-4 shadow-2xl z-50 text-zinc-100">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-2">
            <h4 className="font-semibold text-white">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 hover:underline font-bold"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border text-left transition ${
                    notif.is_read
                      ? "border-transparent bg-[#161722] text-zinc-400"
                      : "border-amber-400/30 bg-amber-400/10 text-white font-medium"
                  }`}
                >
                  <p className="text-xs font-semibold text-white">{notif.title}</p>
                  <p className="text-xs text-zinc-300 mt-0.5">{notif.message}</p>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    {new Date(notif.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
