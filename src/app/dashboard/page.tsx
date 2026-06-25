"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [app, setApp] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user));
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => { setStats(data.stats); setApp(data.app); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500 animate-pulse">Cargando...</div></div>;

  const statCards = [
    { label: "Total Keys", value: stats?.totalKeys ?? 0, color: "from-green-500/20 to-green-600/5", border: "border-green-500/20", text: "text-green-400" },
    { label: "Keys Usadas", value: stats?.usedKeys ?? 0, color: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/20", text: "text-yellow-400" },
    { label: "Usuarios Activos", value: stats?.activeUsers ?? 0, color: "from-blue-500/20 to-blue-600/5", border: "border-blue-500/20", text: "text-blue-400" },
    { label: "Baneados", value: stats?.bannedUsers ?? 0, color: "from-red-500/20 to-red-600/5", border: "border-red-500/20", text: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Bienvenido, {user?.username}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-2xl p-5`}>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
            <p className={`text-3xl font-bold mt-2 ${card.text}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {app && (
        <div className="bg-[#111] border border-gray-800/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Información de la App</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Nombre</p>
              <p className="text-white font-medium">{app.name}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">App ID</p>
              <p className="text-white font-mono text-sm">{app.id}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Secret</p>
              <p className="text-white font-mono text-sm truncate">{app.secret}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
