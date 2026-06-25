"use client";

import { useEffect, useState, useRef } from "react";

interface Session {
  id: number;
  username: string;
  ip_address: string;
  hwid: string;
  pc_name: string;
  os_info: string;
  cpu_info: string;
  ram_info: string;
  gpu_info: string;
  screen_res: string;
  mac_address: string;
  is_rdp: number;
  is_vm: number;
  is_sandbox: number;
  country: string;
  city: string;
  last_heartbeat: string;
  created_at: string;
}

export default function MonitorPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [selected, setSelected] = useState<Session | null>(null);
  const [terminalLog, setTerminalLog] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/admin/monitor?type=active");
      const data = await res.json();
      const newSessions = data.sessions || [];

      // Detect new connections
      if (sessions.length > 0) {
        const oldUsernames = sessions.map((s: Session) => s.username + s.hwid);
        const newUsernames = newSessions.map((s: Session) => s.username + s.hwid);
        for (const u of newUsernames) {
          if (!oldUsernames.includes(u)) {
            const s = newSessions.find((n: Session) => n.username + n.hwid === u);
            if (s) {
              addLog(`[CONN] ${s.username} conectado desde ${s.ip_address} (${s.pc_name})`, "green");
            }
          }
        }
        for (const u of oldUsernames) {
          if (!newUsernames.includes(u)) {
            const s = sessions.find((n: Session) => n.username + n.hwid === u);
            if (s) {
              addLog(`[DCON] ${s.username} desconectado`, "red");
            }
          }
        }
      }

      setSessions(newSessions);
      setLastUpdate(new Date().toLocaleTimeString("es-ES"));
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function addLog(msg: string, color: string = "gray") {
    const time = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setTerminalLog(prev => [...prev.slice(-100), `${time} ${msg}`]);
  }

  useEffect(() => {
    fetchSessions();
    addLog("Sistema de monitoreo iniciado", "green");
    addLog("Escaneando sesiones activas...", "cyan");
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, sessions]);

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [terminalLog]);

  async function kickUser(username: string) {
    if (!confirm(`Kickear a ${username}?`)) return;
    await fetch("/api/admin/monitor", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    addLog(`[KICK] ${username} removido del sistema`, "yellow");
    fetchSessions();
  }

  function formatDate(d: string) {
    if (!d) return "?";
    try {
      return new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch { return d; }
  }

  function getRiskLevel(s: Session): { level: string; color: string } {
    let risk = 0;
    if (s.is_vm) risk++;
    if (s.is_sandbox) risk++;
    if (s.is_rdp) risk++;
    if (!s.hwid) risk++;
    if (risk >= 3) return { level: "ALTO", color: "text-red-400 bg-red-500/15" };
    if (risk >= 2) return { level: "MEDIO", color: "text-yellow-400 bg-yellow-500/15" };
    if (risk >= 1) return { level: "BAJO", color: "text-orange-400 bg-orange-500/15" };
    return { level: "LIMPIO", color: "text-green-400 bg-green-500/15" };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitor de Sesiones</h2>
          <p className="text-gray-500 text-sm mt-1">Sesiones activas y sistema anti-bot</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">Update: {lastUpdate}</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              autoRefresh
                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                : "bg-gray-800 text-gray-400 border border-gray-700"
            }`}
          >
            {autoRefresh ? "● LIVE" : "○ OFF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Sessions Table */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-gray-800/50 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border-b border-gray-800/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-gray-500 ml-2 font-mono">SESIONES ACTIVAS — {sessions.length} usuarios conectados</span>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full font-mono text-xs">
              <thead className="sticky top-0 bg-[#111]">
                <tr className="border-b border-gray-800/50 text-left text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">USR</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">PC</th>
                  <th className="px-4 py-3">OS</th>
                  <th className="px-4 py-3">HWID</th>
                  <th className="px-4 py-3">RIESGO</th>
                  <th className="px-4 py-3">ULTIMO</th>
                  <th className="px-4 py-3">ACC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-600">Escaneando red...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-600">No hay sesiones activas</td></tr>
                ) : sessions.map(s => {
                  const risk = getRiskLevel(s);
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-gray-800/30 hover:bg-white/[0.02] cursor-pointer ${selected?.id === s.id ? "bg-white/[0.05]" : ""}`}
                      onClick={() => setSelected(s)}
                    >
                      <td className="px-4 py-2 text-green-400 font-bold">{s.username}</td>
                      <td className="px-4 py-2 text-blue-400">{s.ip_address}</td>
                      <td className="px-4 py-2 text-gray-300">{s.pc_name || "?"}</td>
                      <td className="px-4 py-2 text-gray-400 truncate max-w-[120px]">{s.os_info || "?"}</td>
                      <td className="px-4 py-2 text-gray-500 font-mono text-[10px]">{s.hwid ? `${s.hwid.substring(0, 16)}...` : "—"}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${risk.color}`}>{risk.level}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{formatDate(s.last_heartbeat)}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); kickUser(s.username); }}
                          className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                        >
                          KICK
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Details + Terminal */}
        <div className="space-y-4">
          {/* User Details */}
          {selected ? (
            <div className="bg-[#0a0a0a] border border-gray-800/50 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-[#111] border-b border-gray-800/50">
                <span className="text-xs text-gray-500 font-mono">DETALLE — {selected.username}</span>
              </div>
              <div className="p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Usuario:</span><span className="text-green-400">{selected.username}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">IP:</span><span className="text-blue-400">{selected.ip_address}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">PC:</span><span className="text-gray-300">{selected.pc_name || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">OS:</span><span className="text-gray-300 truncate max-w-[150px]">{selected.os_info || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CPU:</span><span className="text-gray-300 truncate max-w-[150px]">{selected.cpu_info || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">RAM:</span><span className="text-gray-300">{selected.ram_info || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">GPU:</span><span className="text-gray-300 truncate max-w-[150px]">{selected.gpu_info || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Pantalla:</span><span className="text-gray-300">{selected.screen_res || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">MAC:</span><span className="text-gray-400 text-[10px]">{selected.mac_address || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">HWID:</span><span className="text-gray-400 text-[10px] break-all">{selected.hwid || "N/A"}</span></div>
                <hr className="border-gray-800" />
                <div className="flex justify-between"><span className="text-gray-500">RDP:</span><span className={selected.is_rdp ? "text-yellow-400" : "text-green-400"}>{selected.is_rdp ? "SI" : "NO"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">VM:</span><span className={selected.is_vm ? "text-yellow-400" : "text-green-400"}>{selected.is_vm ? "SI" : "NO"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sandbox:</span><span className={selected.is_sandbox ? "text-yellow-400" : "text-green-400"}>{selected.is_sandbox ? "SI" : "NO"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Pais:</span><span className="text-gray-300">{selected.country || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Ciudad:</span><span className="text-gray-300">{selected.city || "N/A"}</span></div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-gray-800/50 rounded-2xl p-6 text-center">
              <p className="text-gray-600 font-mono text-xs">Selecciona un usuario para ver detalles</p>
            </div>
          )}

          {/* Terminal Log */}
          <div className="bg-[#0a0a0a] border border-gray-800/50 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border-b border-gray-800/50">
              <span className="text-xs text-gray-500 font-mono">LOG TERMINAL</span>
            </div>
            <div
              ref={terminalRef}
              className="p-3 h-[200px] overflow-y-auto font-mono text-[11px] leading-relaxed"
              style={{ background: "#030303" }}
            >
              {terminalLog.map((line, i) => (
                <div key={i} className={`${
                  line.includes("[CONN]") ? "text-green-400" :
                  line.includes("[DCON]") ? "text-red-400" :
                  line.includes("[KICK]") ? "text-yellow-400" :
                  "text-gray-500"
                }`}>
                  {line}
                </div>
              ))}
              <span className="text-green-500 animate-pulse">█</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
