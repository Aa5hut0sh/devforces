"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import GoogleButton from "@/components/GoogleButton";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#1a1122]/80 border border-[#4d2562]/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[#FF9FFC] font-medium hover:text-white transition-colors"
          >
            Register
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-zinc-400 tracking-wide">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="bg-[#09050d] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FF9FFC]/50 focus:ring-2 focus:ring-[#FF9FFC]/20 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-medium text-zinc-400 tracking-wide">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="bg-[#09050d] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FF9FFC]/50 focus:ring-2 focus:ring-[#FF9FFC]/20 transition-all"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-white hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-xl py-3 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          {loading ? "Scanning credentials…" : "Sign in"}
        </button>
      </form>
      
        <div style={{ width: "100%", minHeight: "44px" }} className="flex justify-center">
      <GoogleButton />
      </div>
    </div>
  );
}