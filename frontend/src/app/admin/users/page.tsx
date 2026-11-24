"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { User } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await apiRequest("/admin/users");
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentActive }),
      });
      await fetchUsers();
    } catch (e: any) {
      alert(e.message || "Failed to update user status.");
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-white">User Management</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review registered creators and editors, assign permissions, or suspend accounts.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-[#12131a] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading users...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161722] border-b border-zinc-800 text-[11px] font-bold uppercase text-zinc-400">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Primary Role</th>
                <th className="p-4">Assigned Roles</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#161722]/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                      />
                      <div>
                        <p className="font-bold text-white">{u.full_name || "User"}</p>
                        <span className="text-[10px] text-zinc-400">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300">
                      {u.selected_role || "Unset"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r === "superadmin"
                              ? "bg-purple-950/60 text-purple-300 border border-purple-800/50"
                              : r === "creator"
                              ? "bg-amber-950/60 text-amber-300 border border-amber-800/50"
                              : "bg-blue-950/60 text-blue-300 border border-blue-800/50"
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                          : "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                      }`}
                    >
                      {u.is_active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                        u.is_active
                          ? "border border-zinc-800 bg-[#161722] hover:bg-rose-950/40 text-rose-400 hover:border-rose-800/50"
                          : "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black"
                      }`}
                    >
                      {u.is_active ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
