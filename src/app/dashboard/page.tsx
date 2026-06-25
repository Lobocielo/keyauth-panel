"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [reseller, setReseller] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user));
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => { setStats(data.stats); setReseller(data.reseller); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500 animate-pulse">Cargando...</div></div>;

  const isReseller = !!reseller;

  const statCards = isReseller
    ? [
        { label: "USUARIOS ACTIVOS", value: stats?.usedKeys ?? 0, icon: "👥", bg: "from-gray-800 to-gray-900" },
        { label: "CREDITOS DISPONIBLES", value: reseller?.credits?.toFixed(1) ?? "0.0", icon: "💰", bg: "from-emerald-900/40 to-emerald-950/40", border: "border-emerald-800/30", valueColor: "text-emerald-400" },
        { label: "COSTO BASE X KEY", value: reseller?.credit_cost?.toFixed(1) ?? "1.0", icon: "🏷️", bg: "from-amber-900/30 to-amber-950/30", border: "border-amber-800/30", valueColor: "text-amber-400" },
        { label: "LICENCIAS", value: stats?.totalKeys ?? 0, icon: "🔑", bg: "from-purple-900/30 to-purple-950/30", border: "border-purple-800/30", valueColor: "text-purple-400" },
      ]
    : [
        { label: "Total Keys", value: stats?.totalKeys ?? 0, color: "from-green-500/20 to-green-600/5", border: "border-green-500/20", text: "text-green-400" },
        { label: "Keys Usadas", value: stats?.usedKeys ?? 0, color: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/20", text: "text-yellow-400" },
        { label: "Usuarios Activos", value: stats?.activeUsers ?? 0, color: "from-blue-500/20 to-blue-600/5", border: "border-blue-500/20", text: "text-blue-400" },
        { label: "Baneados", value: stats?.bannedUsers ?? 0, color: "from-red-500/20 to-red-600/5", border: "border-red-500/20", text: "text-red-400" },
      ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        {isReseller && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-emerald-400 font-bold">{reseller?.credits?.toFixed(1) ?? "0.0"}</span>
            <span className="text-emerald-400/70 text-sm">creditos</span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card: any) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.bg || card.color} border ${card.border || "border-gray-800/50"} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
              {card.icon && <span className="text-xl">{card.icon}</span>}
            </div>
            <p className={`text-3xl font-bold ${card.valueColor || card.text || "text-white"}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Account Info (Reseller style) */}
      {isReseller && (
        <div className="bg-[#111] border border-gray-800/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Informacion de la cuenta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">USUARIO</p>
              <p className="text-white font-semibold">{user?.username}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">LIMITE USUARIOS</p>
              <p className="text-white font-semibold">{reseller?.keys_used} / {reseller?.key_limit}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">LICENCIAS</p>
              <p className="text-white font-semibold">{stats?.totalKeys}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">RESTANTE</p>
              <p className="text-white font-semibold">
                {reseller?.key_limit - reseller?.keys_used} ({((reseller?.keys_used / reseller?.key_limit) * 100).toFixed(1)}%)
              </p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">ESTADO</p>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${reseller?.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                {reseller?.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((reseller?.keys_used / reseller?.key_limit) * 100, 100)}%` }}
              />
            </div>
            <p className="text-right text-xs text-gray-600 mt-1">
              {((reseller?.keys_used / reseller?.key_limit) * 100).toFixed(1)}% del limite de usuarios en uso
            </p>
          </div>
        </div>
      )}

      {/* App Info (Admin style) */}
      {!isReseller && (
        <div className="bg-[#111] border border-gray-800/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Informacion de la App</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Nombre</p>
              <p className="text-white font-medium">Panel</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Admin</p>
              <p className="text-white font-medium">{user?.username}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
