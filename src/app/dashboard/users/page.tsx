"use client";

import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setShowCreate(false);
      setForm({ username: "", password: "" });
      fetchUsers();
    } else {
      alert(data.error || "Error");
    }
    setCreating(false);
  }

  async function toggleBan(id: number, current: number) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, is_banned: !current }),
    });
    fetchUsers();
  }

  async function deleteUser(id: number) {
    if (!confirm("Eliminar este usuario?")) return;
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id }),
    });
    fetchUsers();
  }

  function formatDate(d: any) {
    if (!d) return "—";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return "—"; }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Usuarios</h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona los usuarios finales</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl text-sm transition-colors"
        >
          + Crear Usuario
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-[#111] border border-gray-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Nuevo Usuario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No hay usuarios creados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">HWID</th>
                  <th className="px-6 py-4">Ultimo Login</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Creado</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-800/30 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-white font-medium">{u.username}</td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-mono max-w-[180px] truncate" title={u.hwid || ""}>
                      {u.hwid || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.last_login)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_banned ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>
                        {u.is_banned ? "Baneado" : "Activo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => toggleBan(u.id, u.is_banned)} className={`text-xs transition-colors ${u.is_banned ? "text-green-400 hover:text-green-300" : "text-yellow-400 hover:text-yellow-300"}`}>
                          {u.is_banned ? "Desbanear" : "Banear"}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
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
