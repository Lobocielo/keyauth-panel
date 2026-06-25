"use client";

import { useEffect, useState, useRef } from "react";

interface LogEntry {
  id: number;
  app_id: number;
  user_id: number;
  username: string;
  ip_address: string;
  success: number;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "admin" | "failed">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  async function fetchLogs() {
    try {
      const res = await fetch(`/api/admin/logs?limit=200&type=${filter}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setLastUpdate(new Date().toLocaleTimeString("es-ES"));
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, filter]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function formatTime(dateStr: string) {
    if (!dateStr) return "??:??:??";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return dateStr;
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "?/?/?";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Logs</h2>
          <p className="text-gray-500 text-sm mt-1">Registro de accesos al panel</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">Ultima actualizacion: {lastUpdate}</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              autoRefresh
                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                : "bg-gray-800 text-gray-400 border border-gray-700"
            }`}
          >
            {autoRefresh ? "● AUTO" : "○ OFF"}
          </button>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition-colors"
          >
            ↻ Refrescar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "admin", "failed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-green-600 text-white"
                : "bg-[#111] text-gray-400 border border-gray-800 hover:border-gray-700"
            }`}
          >
            {f === "all" ? "Todos" : f === "admin" ? "Admin" : "Fallidos"}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-600 self-center">{logs.length} registros</span>
      </div>

      {/* Terminal Window */}
      <div className="bg-[#0a0a0a] border border-gray-800/50 rounded-2xl overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border-b border-gray-800/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-gray-500 ml-2 font-mono">System Logs — keyauth-panel.vercel.app</span>
        </div>

        {/* Log Content */}
        <div className="p-4 font-mono text-xs leading-relaxed h-[600px] overflow-y-auto" style={{ background: "#050505" }}>
          {loading ? (
            <div className="text-gray-600">
              <span className="text-green-500">$</span> Cargando logs...<br />
              <span className="text-green-500">$</span> <span className="animate-pulse">█</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-gray-600">
              <span className="text-green-500">$</span> No hay registros encontrados.<br />
              <span className="text-green-500">$</span> Esperando eventos de login...
            </div>
          ) : (
            <>
              <div className="text-gray-600 mb-2">
                <span className="text-green-500">$</span> keyauth-panel v2.0 — Logs de acceso<br />
                <span className="text-green-500">$</span> Mostrando {logs.length} registros | Filtro: {filter}<br />
                <span className="text-green-500">$</span> ─────────────────────────────────────────
              </div>
              {logs.map((log, i) => (
                <div key={log.id} className={`flex gap-0 py-0.5 hover:bg-white/[0.02] ${log.success ? "" : "bg-red-500/5"}`}>
                  <span className="text-gray-700 w-16 flex-shrink-0">{formatTime(log.created_at)}</span>
                  <span className="text-gray-700 w-20 flex-shrink-0">{formatDate(log.created_at)}</span>
                  <span className={`w-5 flex-shrink-0 ${log.success ? "text-green-500" : "text-red-500"}`}>
                    {log.success ? "OK" : "ERR"}
                  </span>
                  <span className="text-gray-400 w-28 flex-shrink-0 truncate">{log.username}</span>
                  <span className="text-blue-400/70 w-36 flex-shrink-0">{log.ip_address || "0.0.0.0"}</span>
                  <span className="text-gray-600 flex-1 truncate">
                    {log.success
                      ? `login successful — user: ${log.username}`
                      : `login failed — user: ${log.username}`
                    }
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
              <div className="text-gray-600 mt-2">
                <span className="text-green-500">$</span> <span className="animate-pulse">█</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
