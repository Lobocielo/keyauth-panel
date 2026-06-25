"use client";

import { useEffect, useState } from "react";

interface License {
  id: number;
  license_key: string;
  package_name: string;
  type: number;
  duration_days: number;
  hwid: string;
  is_used: number;
  created_at: string;
  expires_at: string;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({ package_name: "Default", subscription_days: "30", type: "1", quantity: "1" });
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchLicenses(); }, []);

  async function fetchLicenses() {
    setLoading(true);
    const res = await fetch("/api/keys");
    const data = await res.json();
    setLicenses(data.keys || []);
    setLoading(false);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package_name: form.package_name,
        subscription_days: parseInt(form.subscription_days),
        type: parseInt(form.type),
        quantity: parseInt(form.quantity),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowGenerate(false);
      setForm({ package_name: "Default", subscription_days: "30", type: "1", quantity: "1" });
      fetchLicenses();
    } else {
      alert(data.error || "Error al generar");
    }
    setGenerating(false);
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
  }

  const filtered = licenses.filter(l =>
    l.license_key.toLowerCase().includes(search.toLowerCase()) ||
    (l.package_name || "").toLowerCase().includes(search.toLowerCase())
  );

  function getTypeLabel(type: number) {
    if (type === 1) return { label: "Normal", color: "text-blue-400 bg-blue-500/15" };
    if (type === 2) return { label: "Trial", color: "text-yellow-400 bg-yellow-500/15" };
    return { label: "Lifetime", color: "text-purple-400 bg-purple-500/15" };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Licencias</h2>
      </div>

      {/* Table Header */}
      <div className="bg-[#111] border border-gray-800/50 rounded-2xl overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-gray-800/50">
          <h3 className="text-white font-semibold">Mis licencias ({licenses.length})</h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar licencias..."
              className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/50 w-64"
            />
            <button
              onClick={() => setShowGenerate(!showGenerate)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl text-sm transition-colors"
            >
              + Generar licencia
            </button>
          </div>
        </div>

        {/* Generate Form */}
        {showGenerate && (
          <form onSubmit={handleGenerate} className="p-4 border-b border-gray-800/50 bg-[#0d0d0d]">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Paquete</label>
                <input
                  value={form.package_name}
                  onChange={e => setForm({ ...form, package_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Dias</label>
                <input
                  type="number"
                  min={1}
                  value={form.subscription_days}
                  onChange={e => setForm({ ...form, subscription_days: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
                >
                  <option value="1">Normal</option>
                  <option value="2">Trial</option>
                  <option value="3">Lifetime</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={generating} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl text-sm transition-colors">
                  {generating ? "Generando..." : "Generar"}
                </button>
                <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            {licenses.length === 0 ? "No hay licencias generadas" : "No se encontraron resultados"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-6 py-3">KEY</th>
                  <th className="px-6 py-3">PAQUETE</th>
                  <th className="px-6 py-3">DIAS</th>
                  <th className="px-6 py-3">HWID</th>
                  <th className="px-6 py-3">ESTADO</th>
                  <th className="px-6 py-3">FECHA</th>
                  <th className="px-6 py-3">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lic => {
                  const typeInfo = getTypeLabel(lic.type);
                  return (
                    <tr key={lic.id} className="border-b border-gray-800/30 hover:bg-white/[0.02]">
                      <td className="px-6 py-3">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white">{lic.license_key}</span>
                          <button onClick={() => copyKey(lic.license_key)} className="text-gray-500 hover:text-gray-300 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-300">{lic.package_name || "Default"}</td>
                      <td className="px-6 py-3 text-sm text-gray-300">{lic.type === 3 ? "∞" : `${lic.duration_days}d`}</td>
                      <td className="px-6 py-3 text-sm text-gray-500 font-mono">{lic.hwid ? `${lic.hwid.substring(0, 12)}...` : "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${lic.is_used ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"}`}>
                          {lic.is_used ? "En uso" : "Disponible"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(lic.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </td>
                      <td className="px-6 py-3">
                        <button className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 bg-gray-800/50 rounded-lg">
                          Acciones ▾
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
