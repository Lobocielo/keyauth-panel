"use client";

import { useEffect, useState } from "react";

interface Reseller {
  id: number;
  username: string;
  key_limit: number;
  keys_used: number;
  credits: number;
  credit_cost: number;
  is_active: number;
  created_at: string;
}

export default function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", key_limit: 50, credits: 0, credit_cost: 1.0 });
  const [creating, setCreating] = useState(false);
  const [editingCredits, setEditingCredits] = useState<number | null>(null);
  const [creditAmount, setCreditAmount] = useState("");

  useEffect(() => { fetchResellers(); }, []);

  async function fetchResellers() {
    setLoading(true);
    const res = await fetch("/api/admin/resellers");
    const data = await res.json();
    setResellers(data.resellers || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/resellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setShowCreate(false);
      setForm({ username: "", password: "", key_limit: 50, credits: 0, credit_cost: 1.0 });
      fetchResellers();
    } else {
      alert(data.error || "Error");
    }
    setCreating(false);
  }

  async function toggleActive(id: number, current: number) {
    await fetch("/api/admin/resellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reseller_id: id, is_active: !current }),
    });
    fetchResellers();
  }

  async function updateLimit(id: number, newLimit: number) {
    await fetch("/api/admin/resellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reseller_id: id, key_limit: newLimit }),
    });
    fetchResellers();
  }

  async function updateCreditCost(id: number, cost: number) {
    await fetch("/api/admin/resellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reseller_id: id, credit_cost: cost }),
    });
    fetchResellers();
  }

  async function addCredits(id: number, amount: number) {
    if (amount <= 0) return;
    await fetch("/api/admin/resellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reseller_id: id, add_credits: amount }),
    });
    setEditingCredits(null);
    setCreditAmount("");
    fetchResellers();
  }

  async function removeCredits(id: number, amount: number) {
    if (amount <= 0) return;
    await fetch("/api/admin/resellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reseller_id: id, remove_credits: amount }),
    });
    setEditingCredits(null);
    setCreditAmount("");
    fetchResellers();
  }

  async function deleteReseller(id: number) {
    if (!confirm("Eliminar este revendedor?")) return;
    await fetch("/api/admin/resellers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reseller_id: id }),
    });
    fetchResellers();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Revendedores</h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus revendedores y creditos</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl text-sm transition-colors"
        >
          + Crear Revendedor
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-[#111] border border-gray-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Nuevo Revendedor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Usuario</label>
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Limite de Keys</label>
              <input
                type="number"
                min={1}
                value={form.key_limit}
                onChange={e => setForm({ ...form, key_limit: parseInt(e.target.value) || 50 })}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Creditos Iniciales</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.credits}
                onChange={e => setForm({ ...form, credits: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Costo por Key</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={form.credit_cost}
                onChange={e => setForm({ ...form, credit_cost: parseFloat(e.target.value) || 1.0 })}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
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
        ) : resellers.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No hay revendedores creados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Keys</th>
                  <th className="px-6 py-4">Limite</th>
                  <th className="px-6 py-4">Creditos</th>
                  <th className="px-6 py-4">Costo/Key</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {resellers.map(r => (
                  <tr key={r.id} className="border-b border-gray-800/30 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-gray-400 text-xs font-medium">{r.username[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-white font-medium">{r.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{r.keys_used}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        defaultValue={r.key_limit}
                        onBlur={(e) => updateLimit(r.id, parseInt(e.target.value) || 50)}
                        className="w-20 px-2 py-1 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white text-sm text-center focus:outline-none focus:border-green-500/50"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {editingCredits === r.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step={0.5}
                            value={creditAmount}
                            onChange={e => setCreditAmount(e.target.value)}
                            className="w-20 px-2 py-1 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white text-sm text-center focus:outline-none focus:border-green-500/50"
                            placeholder="0"
                            autoFocus
                          />
                          <button onClick={() => addCredits(r.id, parseFloat(creditAmount) || 0)} className="text-xs text-green-400 hover:text-green-300 px-1">+</button>
                          <button onClick={() => removeCredits(r.id, parseFloat(creditAmount) || 0)} className="text-xs text-red-400 hover:text-red-300 px-1">-</button>
                          <button onClick={() => { setEditingCredits(null); setCreditAmount(""); }} className="text-xs text-gray-500 hover:text-gray-300 px-1">x</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingCredits(r.id); setCreditAmount(""); }}
                          className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                        >
                          {r.credits?.toFixed(1) ?? "0.0"}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        defaultValue={r.credit_cost}
                        onBlur={(e) => updateCreditCost(r.id, parseFloat(e.target.value) || 1.0)}
                        className="w-16 px-2 py-1 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white text-sm text-center focus:outline-none focus:border-green-500/50"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${r.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                        {r.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => toggleActive(r.id, r.is_active)} className={`text-xs transition-colors ${r.is_active ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}`}>
                          {r.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button onClick={() => deleteReseller(r.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                          Eliminar
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
