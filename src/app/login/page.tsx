"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"admin" | "reseller">("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [appId, setAppId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = form.get("username") as string;
    const password = form.get("password") as string;

    try {
      const endpoint = tab === "admin" ? "/api/auth/login" : "/api/auth/reseller-login";
      const body: any = { username, password };
      if (tab === "admin" && appId) body.appId = appId;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f0f 100%)" }}>
      <div className="w-full max-w-[440px]">
        <div className="bg-[#111] rounded-2xl border border-gray-800/50 p-8 shadow-2xl">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-white">Zeniht</h1>
                <p className="text-xs text-gray-500">Panel de control</p>
              </div>
            </div>
          </div>

          {/* Admin / Reseller Tabs */}
          <div className="flex bg-[#1a1a1a] rounded-xl p-1 mb-6">
            <button
              onClick={() => { setTab("admin"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === "admin"
                  ? "bg-[#2a2a2a] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => { setTab("reseller"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === "reseller"
                  ? "bg-[#2a2a2a] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Revendedor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Usuario */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Usuario</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  name="username"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                  placeholder={tab === "admin" ? "Zeniht" : "Tu usuario"}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contraseña</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* ID de Aplicación (admin only) */}
            {tab === "admin" && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ID de Aplicación</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  </span>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                    placeholder="Opcional - ID de tu app"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          LicensePanel &copy; 2025
        </p>
      </div>
    </div>
  );
}
