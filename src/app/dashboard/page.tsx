"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalKeys: number;
  usedKeys: number;
  activeUsers: number;
  bannedUsers: number;
}

interface AppInfo {
  id: number;
  name: string;
  secret: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [app, setApp] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setApp(data.app);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function copySecret() {
    if (app?.secret) {
      navigator.clipboard.writeText(app.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Keys", value: stats?.totalKeys ?? 0, color: "text-primary-400" },
    { label: "Used Keys", value: stats?.usedKeys ?? 0, color: "text-yellow-400" },
    { label: "Active Users", value: stats?.activeUsers ?? 0, color: "text-green-400" },
    { label: "Banned Users", value: stats?.bannedUsers ?? 0, color: "text-red-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-gray-400 mt-1">Overview of your application</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">{card.label}</p>
            <p className={`text-3xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {app && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">App Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">App Name</span>
              <span className="text-gray-200">{app.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">App ID</span>
              <span className="text-gray-200 font-mono">{app.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">App Secret</span>
              <div className="flex items-center gap-2">
                <code className="text-gray-200 font-mono text-sm bg-gray-800 px-3 py-1 rounded">
                  {app.secret.substring(0, 12)}...
                </code>
                <button
                  onClick={copySecret}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">API Usage</h3>
        <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-2">
          <p className="text-gray-500"># Initialize in your application</p>
          <p>
            <span className="text-primary-400">const</span> appSecret = <span className="text-green-400">&quot;{app?.secret || 'YOUR_SECRET'}&quot;</span>;
          </p>
          <p className="text-gray-500 mt-2"># POST /api/validate</p>
          <p>
            {"{"} username, password, hwid, key {"}"}
          </p>
        </div>
      </div>
    </div>
  );
}
