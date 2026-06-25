"use client";

import { useEffect, useState } from "react";

export default function KeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ key: "", subscription_days: "30", type: "1", notes: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user));
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.keys || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subscription_days: parseInt(form.subscription_days),
        type: parseInt(form.type),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowCreate(false);
      setForm({ key: "", subscription_days: "30", type: "1", notes: "" });
      fetchKeys();
    } else {
      alert(data.error || "Error");
    }
    setCreating(false);
  }

  async function deleteKey(id: number) {
    if (!confirm("Eliminar esta key?")) return;
    await fetch("/api/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key_id: id }),
    });
    fetchKeys();
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{user?.type === "reseller" ? "Generate Keys" : "Keys"}</h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus claves de licencia</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl text-sm transition-colors"
        >
          + Crear Key
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-[#111] border border-gray-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Nueva Key</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Key (dejar vacio para auto-generar)</label>
              <input
                value={form.key}
                onChange={e => setForm({ ...form, key: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50 font-mono"
                placeholder="Auto-generada"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Dias de suscripcion</label>
              <input
                type="number"
                min={1}
                value={form.subscription_days}
                onChange={e => setForm({ ...form, subscription_days: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
              >
                <option value="1">Normal</option>
                <option value="2">Trial</option>
                <option value="3">Lifetime</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Notas</label>
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={creating} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl text-sm transition-colors">
              {creating ? "Creando..." : "Crear"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-[#111] border border-gray-800/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No hay keys creadas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Key</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Dias</th>
                  <th className="px-6 py-4">Expira</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} className="border-b border-gray-800/30 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white">{k.key_value}</span>
                        <button onClick={() => copyKey(k.key_value)} className="text-gray-500 hover:text-gray-300 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${k.type === 1 ? "bg-blue-500/15 text-blue-400" : k.type === 2 ? "bg-yellow-500/15 text-yellow-400" : "bg-purple-500/15 text-purple-400"}`}>
                        {k.type === 1 ? "Normal" : k.type === 2 ? "Trial" : "Lifetime"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{k.subscription_days}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {k.type === 3 ? "Nunca" : k.expires_at ? new Date(k.expires_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${k.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                        {k.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => deleteKey(k.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                        Eliminar
                      </button>
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
