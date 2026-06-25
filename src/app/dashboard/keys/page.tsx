"use client";

import { useEffect, useState } from "react";

interface License {
  id: number;
  license_key: string;
  type: string;
  duration_days: number;
  is_used: number;
  used_by: number | null;
  created_at: string;
  expires_at: string | null;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const [form, setForm] = useState({ type: "subscription", duration_days: 30, quantity: 1 });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.keys || []);
    setLoading(false);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.keys) {
        setNewKeys(data.keys);
        setShowModal(true);
        fetchKeys();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(keyId: number) {
    if (!confirm("Delete this key?")) return;
    await fetch("/api/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId }),
    });
    fetchKeys();
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
  }

  function copyAllKeys() {
    navigator.clipboard.writeText(newKeys.join("\n"));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">License Keys</h2>
          <p className="text-gray-400 mt-1">Generate and manage license keys</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Generate New Keys</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="subscription">Subscription</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          {form.type === "subscription" && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Duration (days)</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) || 30 })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Quantity</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={generating}
          className="mt-4 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white font-medium rounded-lg transition-colors"
        >
          {generating ? "Generating..." : "Generate Keys"}
        </button>
      </form>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold">All Keys ({keys.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No keys generated yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
                  <th className="px-6 py-3">Key</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Expires</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-6 py-3 font-mono text-sm">
                      <button onClick={() => copyKey(key.license_key)} className="hover:text-primary-400 transition-colors" title="Click to copy">
                        {key.license_key}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs ${key.type === "lifetime" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                        {key.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-300">
                      {key.type === "lifetime" ? "Forever" : `${key.duration_days}d`}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${key.is_used ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>
                        {key.is_used ? "Used" : "Unused"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Keys Generated!</h3>
            <div className="bg-gray-800 rounded-lg p-4 mb-4 max-h-60 overflow-auto">
              {newKeys.map((key, i) => (
                <div key={i} className="font-mono text-sm text-gray-200 py-1 border-b border-gray-700 last:border-0">
                  {key}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyAllKeys}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Copy All
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
