"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ClientConfig } from "@/lib/clients";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  clientCssVars,
} from "@/lib/format";
import { KpiCard } from "./KpiCard";
import { SpendChart, ClicksChart } from "./Charts";
import { DataTable } from "./DataTable";
import { LoginGate } from "./LoginGate";

type DatePreset =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_14d"
  | "last_30d"
  | "this_month"
  | "last_month";

interface InsightsData {
  client: { id: string; name: string; currency: string };
  account: { name: string; status: number; timezone: string };
  preset: string;
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    ctr: number;
    cpc: number;
    cpm: number;
    messages: number;
    leads: number;
    purchases: number;
  };
  daily: Array<{
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
  }>;
  campaigns: Array<{
    id?: string;
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
  }>;
  adSets: Array<{
    id?: string;
    name: string;
    campaign: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
  }>;
  updatedAt: string;
  error?: string;
  hint?: string;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "last_7d", label: "7 días" },
  { value: "last_14d", label: "14 días" },
  { value: "last_30d", label: "30 días" },
  { value: "this_month", label: "Este mes" },
  { value: "last_month", label: "Mes anterior" },
];

interface DashboardProps {
  client: ClientConfig;
}

export function Dashboard({ client }: DashboardProps) {
  const [preset, setPreset] = useState<DatePreset>("last_30d");
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/insights?preset=${preset}`);

    if (res.status === 401) {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Error al cargar datos");
      setData(null);
    } else {
      setData(json);
      setNeedsAuth(false);
    }

    setLoading(false);
  }, [preset]);

  useEffect(() => {
    if (!needsAuth || authenticated) {
      fetchData();
    }
  }, [fetchData, needsAuth, authenticated]);

  const style = clientCssVars(client);
  const currency = data?.client.currency || client.currency;
  const locale = client.locale;

  if (needsAuth && !authenticated) {
    return (
      <div style={style}>
        <LoginGate clientName={client.name} onSuccess={() => setAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={style}>
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src={client.logo}
              alt={client.name}
              width={40}
              height={40}
              className="rounded-xl"
            />
            <div>
              <h1 className="text-lg font-semibold">{client.name}</h1>
              <p className="text-xs text-gray-500">{client.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as DatePreset)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--client-primary)]"
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <button
              onClick={fetchData}
              disabled={loading}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "…" : "↻"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-red-600">
              Configurá las variables de entorno META_ACCESS_TOKEN y META_AD_ACCOUNT_ID.
              Revisá que el token tenga permiso <code className="text-xs">ads_read</code>.
            </p>
          </div>
        )}

        {data?.account && (
          <p className="mb-6 text-sm text-gray-500">
            Cuenta: <span className="font-medium text-gray-700">{data.account.name}</span>
            {data.updatedAt && (
              <span className="ml-2">
                · Actualizado {new Date(data.updatedAt).toLocaleString(locale)}
              </span>
            )}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Gasto total"
            value={
              data
                ? formatCurrency(data.totals.spend, currency, locale)
                : loading
                  ? "—"
                  : "$0"
            }
          />
          <KpiCard
            label="Impresiones"
            value={data ? formatNumber(data.totals.impressions, locale) : "—"}
          />
          <KpiCard
            label="Clics"
            value={data ? formatNumber(data.totals.clicks, locale) : "—"}
            sub={data ? `CTR ${formatPercent(data.totals.ctr)}` : undefined}
          />
          <KpiCard
            label="Alcance"
            value={data ? formatNumber(data.totals.reach, locale) : "—"}
            sub={data ? `CPC ${formatCurrency(data.totals.cpc, currency, locale)}` : undefined}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="CPM"
            value={data ? formatCurrency(data.totals.cpm, currency, locale) : "—"}
          />
          <KpiCard
            label="Mensajes"
            value={data ? formatNumber(data.totals.messages, locale) : "—"}
          />
          <KpiCard
            label="Leads"
            value={data ? formatNumber(data.totals.leads, locale) : "—"}
          />
          <KpiCard
            label="Compras"
            value={data ? formatNumber(data.totals.purchases, locale) : "—"}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Gasto diario</h3>
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                Cargando…
              </div>
            ) : data ? (
              <SpendChart data={data.daily} currency={currency} locale={locale} />
            ) : null}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Clics por día</h3>
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                Cargando…
              </div>
            ) : data ? (
              <ClicksChart data={data.daily} locale={locale} />
            ) : null}
          </div>
        </div>

        {data && (
          <div className="mt-8 space-y-6">
            <DataTable
              title="Campañas"
              columns={[
                { key: "name", label: "Campaña" },
                { key: "spend", label: "Gasto", align: "right" },
                { key: "impressions", label: "Impresiones", align: "right" },
                { key: "clicks", label: "Clics", align: "right" },
                { key: "ctr", label: "CTR", align: "right" },
                { key: "cpc", label: "CPC", align: "right" },
              ]}
              rows={data.campaigns.map((c) => ({
                name: c.name,
                spend: formatCurrency(c.spend, currency, locale),
                impressions: formatNumber(c.impressions, locale),
                clicks: formatNumber(c.clicks, locale),
                ctr: formatPercent(c.ctr),
                cpc: formatCurrency(c.cpc, currency, locale),
              }))}
            />

            <DataTable
              title="Conjuntos de anuncios"
              columns={[
                { key: "name", label: "Ad Set" },
                { key: "campaign", label: "Campaña" },
                { key: "spend", label: "Gasto", align: "right" },
                { key: "clicks", label: "Clics", align: "right" },
                { key: "ctr", label: "CTR", align: "right" },
              ]}
              rows={data.adSets.map((a) => ({
                name: a.name,
                campaign: a.campaign,
                spend: formatCurrency(a.spend, currency, locale),
                clicks: formatNumber(a.clicks, locale),
                ctr: formatPercent(a.ctr),
              }))}
            />
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Dashboard Meta Ads · {client.name}
      </footer>
    </div>
  );
}
