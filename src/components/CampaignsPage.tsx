"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientConfig } from "@/lib/clients";
import { clientCssVars } from "@/lib/format";
import { AppHeader } from "./AppHeader";
import { AdminLoginGate } from "./AdminLoginGate";

interface CampaignsData {
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    objective: string;
    daily_budget?: string;
  }>;
  adSets: Array<{
    id: string;
    name: string;
    status: string;
    campaign_id: string;
    daily_budget?: string;
  }>;
  ads: Array<{ id: string; name: string; status: string; adset_id?: string }>;
  pages: Array<{ id: string; name: string }>;
  objectives: Array<{ value: string; label: string }>;
}

interface CampaignsPageProps {
  client: ClientConfig;
}

export function CampaignsPage({ client }: CampaignsPageProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState<CampaignsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [campName, setCampName] = useState("");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [dailyBudget, setDailyBudget] = useState("5000");
  const [createAdSet, setCreateAdSet] = useState(true);
  const [pageId, setPageId] = useState("");

  const [adSetId, setAdSetId] = useState("");
  const [adName, setAdName] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [headline, setHeadline] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const style = clientCssVars(client);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/campaigns");
    if (res.status === 401) {
      setAuthenticated(false);
      setChecking(false);
      setLoading(false);
      return;
    }
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Error al cargar");
      setData(null);
    } else {
      setData(json);
      setPageId((prev) => prev || json.pages?.[0]?.id || "");
      setAdSetId((prev) => prev || json.adSets?.[0]?.id || "");
    }
    setLoading(false);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (authenticated) load();
  }, [authenticated, load]);

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/settings");
      if (res.status === 401) {
        setAuthenticated(false);
      } else {
        setAuthenticated(true);
      }
      setChecking(false);
    };
    check();
  }, [adSetId, pageId]);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_campaign",
        name: campName,
        objective,
        dailyBudget: Number(dailyBudget),
        createAdSet,
        pageId: pageId || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Error");
      return;
    }
    setMessage(json.message || "Campaña creada");
    setCampName("");
    load();
  }

  async function handleUploadAd(e: React.FormEvent) {
    e.preventDefault();
    if (!image) {
      setMessage("Seleccioná una imagen");
      return;
    }
    setMessage(null);
    const form = new FormData();
    form.set("image", image);
    form.set("adSetId", adSetId);
    form.set("pageId", pageId);
    form.set("adName", adName);
    form.set("primaryText", primaryText);
    form.set("headline", headline);
    form.set("linkUrl", linkUrl);

    const res = await fetch("/api/ads", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Error");
      return;
    }
    setMessage(json.message || "Anuncio creado");
    setImage(null);
    setAdName("");
    setPrimaryText("");
    setHeadline("");
    load();
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400" style={style}>
        Cargando…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={style}>
        <AdminLoginGate
          clientName={client.name}
          onSuccess={() => setAuthenticated(true)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={style}>
      <AppHeader client={client} active="campaigns" />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="mb-6 text-sm text-gray-500">
          Creá campañas y subí anuncios. Todo se crea en <strong>pausa</strong> para que revises en Meta antes de activar.
          El token necesita permiso <code className="text-xs">ads_management</code>.
        </p>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleCreateCampaign}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold">Nueva campaña</h2>
            <div className="mt-4 space-y-3">
              <input
                required
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                placeholder="Nombre de la campaña"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              >
                {(data?.objectives || []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="100"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                placeholder="Presupuesto diario (ARS)"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
              {data?.pages && data.pages.length > 0 && (
                <select
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                >
                  {data.pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      Página: {p.name}
                    </option>
                  ))}
                </select>
              )}
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={createAdSet}
                  onChange={(e) => setCreateAdSet(e.target.checked)}
                />
                Crear ad set básico (Argentina, pausado)
              </label>
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-[var(--client-primary)] py-2.5 text-sm font-medium text-white"
            >
              Crear campaña
            </button>
          </form>

          <form
            onSubmit={handleUploadAd}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold">Subir anuncio</h2>
            <div className="mt-4 space-y-3">
              <select
                required
                value={adSetId}
                onChange={(e) => setAdSetId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              >
                <option value="">Elegí un ad set</option>
                {(data?.adSets || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.status})
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
              <input
                value={adName}
                onChange={(e) => setAdName(e.target.value)}
                placeholder="Nombre del anuncio"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
              <textarea
                required
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                placeholder="Texto principal"
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
              <input
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Título"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
              <input
                required
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://tu-tienda.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!data?.adSets?.length}
              className="mt-4 w-full rounded-xl bg-[var(--client-primary)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Subir anuncio
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold">Campañas existentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400">
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Objetivo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                      Cargando…
                    </td>
                  </tr>
                ) : (data?.campaigns || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                      Sin campañas
                    </td>
                  </tr>
                ) : (
                  data?.campaigns.map((c) => (
                    <tr key={c.id} className="border-t border-gray-50">
                      <td className="px-5 py-3">{c.name}</td>
                      <td className="px-5 py-3">{c.status}</td>
                      <td className="px-5 py-3">{c.objective}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
