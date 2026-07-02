"use client";

import { useState } from "react";
import type { ClientConfig } from "@/lib/clients";

interface ClientSwitcherProps {
  clients: Pick<ClientConfig, "id" | "name">[];
  currentId: string;
  isAdmin: boolean;
}

export function ClientSwitcher({
  clients,
  currentId,
  isAdmin,
}: ClientSwitcherProps) {
  const [loading, setLoading] = useState(false);

  if (clients.length <= 1 || !isAdmin) return null;

  async function onChange(clientId: string) {
    if (clientId === currentId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "No se pudo cambiar de cliente");
      }
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cambiar cliente");
      setLoading(false);
    }
  }

  return (
    <select
      value={currentId}
      disabled={loading}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--client-primary)] disabled:opacity-50"
      aria-label="Cliente"
    >
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
