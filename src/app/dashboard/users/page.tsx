"use client";

import { useEffect, useState } from "react";

interface EndUser {
  id: number;
  username: string;
  hwid: string;
  is_banned: number;
  last_login: string | null;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<EndUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function toggleBan(userId: number, currentBanned: number) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, is_banned: !currentBanned }),
    });
    fetchUsers();
  }

  async function handleDelete(userId: number) {
    if (!confirm("Delete this user?")) return;
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchUsers();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">End Users</h2>
        <p className="text-gray-400 mt-1">Manage users registered to your application</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold">Users ({users.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users registered yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">HWID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Login</th>
                  <th className="px-6 py-3">Registered</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-6 py-3 font-medium">{user.username}</td>
                    <td className="px-6 py-3 text-sm text-gray-400 font-mono">
                      {user.hwid || "N/A"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${user.is_banned ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                        {user.is_banned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleBan(user.id, user.is_banned)}
                          className={`text-sm transition-colors ${user.is_banned ? "text-green-400 hover:text-green-300" : "text-yellow-400 hover:text-yellow-300"}`}
                        >
                          {user.is_banned ? "Unban" : "Ban"}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
