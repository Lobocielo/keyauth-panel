"use client";

import { useEffect, useState } from "react";

const creditPackages = [
  { name: "INICIAL", credits: 50, price: "$53", desc: "Para empezar" },
  { name: "BALANCEADO", credits: 100, price: "$95", desc: "Uso frecuente" },
  { name: "RECOMENDADO", credits: 250, price: "$210", desc: "Mejor valor", popular: true },
  { name: "PRO", credits: 500, price: "$380", desc: "Revendedores activos" },
];

export default function CreditsPage() {
  const [reseller, setReseller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => { setReseller(data.reseller); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500 animate-pulse">Cargando...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Creditos</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="text-emerald-400 font-bold text-lg">{reseller?.credits?.toFixed(1) ?? "0.0"}</span>
          <span className="text-emerald-400/70 text-sm">creditos</span>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="bg-[#111] border border-gray-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-green-400 text-sm font-bold uppercase">Billetera Reseller</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-1">Creditos y planes</h3>
        <p className="text-gray-500 text-sm mb-6">Gestiona tu saldo y solicita recargas al administrador.</p>

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Saldo Disponible</p>
            <p className="text-4xl font-bold text-white">{reseller?.credits?.toFixed(1) ?? "0.0"} <span className="text-lg text-gray-400">creditos</span></p>
            <p className="text-green-400 text-sm mt-1">Cuenta activa</p>
          </div>
        </div>

        {/* Packages */}
        <div className="mb-4">
          <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-1">PASO 1</p>
          <h4 className="text-white font-semibold mb-1">Elige una cantidad</h4>
          <p className="text-gray-500 text-xs text-right">Los creditos se asignan desde el panel admin.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPackages.map(pkg => (
            <div
              key={pkg.name}
              className={`relative bg-[#1a1a1a] border rounded-2xl p-5 transition-all hover:border-green-500/30 ${
                pkg.popular ? "border-green-500/50" : "border-gray-800/50"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 right-4 px-3 py-0.5 bg-green-500 text-white text-[10px] font-bold uppercase rounded-full">
                  Popular
                </div>
              )}
              <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">{pkg.name}</p>
              <p className="text-3xl font-bold text-white mb-1">{pkg.credits}</p>
              <p className="text-gray-500 text-xs uppercase mb-4">Creditos</p>
              <p className="text-xl font-bold text-white mb-1">{pkg.price}</p>
              <p className="text-gray-500 text-sm mb-6">{pkg.desc}</p>
              <button className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                Contactar admin
              </button>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-[#1a1a1a] border border-gray-800/50 rounded-xl">
          <p className="text-gray-400 text-sm">
            <span className="font-semibold text-gray-300">Nota:</span> Los creditos los asigna el administrador desde Admin &gt; Revendedores &gt; Coins.
          </p>
        </div>
      </div>
    </div>
  );
}
