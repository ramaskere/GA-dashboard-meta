"use client";

import { useEffect, useMemo, useState } from "react";

interface ClientRow {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  currency?: string;
}

interface AddClientPanelProps {
  currentClientId: string;
  supabaseReady: boolean;
}

export function AddClientPanel({
  currentClientId,
  supabaseReady,
}: AddClientPanelProps) {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [tagline, setTagline] = useState("Reportes de Meta Ads");
  const [primaryColor, setPrimaryColor] = useState("#0071e3");
  const [currency, setCurrency] = useState("ARS");

  const suggestedId = useMemo(() => slugify(name), [name]);

  useEffect(() => {
    if (!idTouched) setId(suggestedId);
  }, [suggestedId, idTouched]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.clients)) setClients(json.clients);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          id: id || suggestedId,
          tagline,
          primaryColor,
          currency,
          switchTo: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo crear");

      setMessage({
        type: "ok",
        text: `Cliente "${json.client.name}" creado. Configurá el token de Meta abajo y guardá.`,
      });
      setName("");
      setId("");
      setIdTouched(false);
      setTagline("Reportes de Meta Ads");

      // Recargar para activar el cliente nuevo
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Error al crear",
      });
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-[#1d1d1f]">Clientes</h2>
      <p className="mt-1 text-xs text-gray-500">
        Agregá un cliente nuevo desde acá. Después elegilo en el selector del header y
        cargá su token de Meta.
      </p>

      {!supabaseReady && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Supabase no está listo. Sin eso no se pueden guardar clientes nuevos.
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Existentes
        </p>
        {loading ? (
          <p className="mt-2 text-sm text-gray-400">Cargando…</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {clients.map((c) => (
              <li
                key={c.id}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                  c.id === currentClientId
                    ? "border-[var(--client-primary)]/40 bg-blue-50/50"
                    : "border-gray-100"
                }`}
              >
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-400">
                  {c.id}
                  {c.id === currentClientId ? " · activo" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleCreate} className="mt-6 space-y-4 border-t border-gray-100 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Nuevo cliente
        </p>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Tienda Norte"
            required
            className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--client-primary)]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">ID (slug)</span>
          <p className="text-xs text-gray-400">Se usa en la base de datos. Solo minúsculas y guiones.</p>
          <input
            value={id}
            onChange={(e) => {
              setIdTouched(true);
              setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            placeholder="tienda-norte"
            required
            className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--client-primary)]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Tagline</span>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--client-primary)]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Color principal</span>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-gray-200"
              />
              <input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--client-primary)]"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Moneda</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--client-primary)]"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
              <option value="CLP">CLP</option>
              <option value="UYU">UYU</option>
            </select>
          </label>
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === "ok" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !supabaseReady || !name.trim()}
          className="w-full rounded-xl bg-[var(--client-primary)] py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Creando…" : "Crear cliente y cambiar a él"}
        </button>
      </form>
    </section>
  );
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
