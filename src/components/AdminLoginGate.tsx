"use client";

import { useState } from "react";

interface AdminLoginGateProps {
  onSuccess: () => void;
  clientName: string;
}

export function AdminLoginGate({ onSuccess, clientName }: AdminLoginGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Contraseña incorrecta");
      return;
    }

    onSuccess();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Administración
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[#1d1d1f]">{clientName}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Contraseña de admin para configurar la API de Meta
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="ADMIN_PASSWORD"
          className="mt-6 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[var(--client-primary)] focus:ring-2 focus:ring-[var(--client-primary)]/20"
          autoFocus
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 w-full rounded-xl bg-[var(--client-primary)] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
