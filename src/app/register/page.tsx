"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = form.get("username") as string;
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;

    if (password !== confirm) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-400">LicensePanel</h1>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
            <input
              name="username"
              type="text"
              required
              minLength={3}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={4}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Min 4 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <input
              name="confirm"
              type="password"
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-gray-400 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-400 hover:text-primary-300">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
