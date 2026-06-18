"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ClientConfig } from "@/lib/clients";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  clientCssVars,
} from "@/lib/format";
import {
  enabledWidgets,
  defaultWidgetConfig,
  type WidgetConfig,
  type WidgetId,
} from "@/lib/widgets";
import { KpiCard } from "./KpiCard";
import { SpendChart, ClicksChart } from "./Charts";
import { DataTable } from "./DataTable";
import { LoginGate } from "./LoginGate";
import { AppHeader } from "./AppHeader";

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
  widgetConfig?: WidgetConfig;
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
  const [needsSetup, setNeedsSetup] = useState(false);
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

    if (res.status === 503 && json.needsSetup) {
      setNeedsSetup(true);
      setError(json.error || "API no configurada");
      setData(null);
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setNeedsSetup(false);
      setError(json.error || "Error al cargar datos");
      setData(null);
    } else {
      setNeedsSetup(false);
      setData(json);
      setNeedsAuth(false);
    }
    setLoading(false);
  }, [preset]);

  useEffect(() => {
    if (!needsAuth || authenticated) fetchData();
  }, [fetchData, needsAuth, authenticated]);

  const style = clientCssVars(client);
  const currency = data?.client.currency || client.currency;
  const locale = client.locale;
  const widgetConfig = data?.widgetConfig || defaultWidgetConfig();
  const widgets = enabledWidgets(widgetConfig);

  function renderWidget(id: WidgetId) {
    if (!data && !loading) return null;

    switch (id) {
      case "kpi_spend":
        return (
          <KpiCard
            key={id}
            label="Gasto total"
            value={
              data
                ? formatCurrency(data.totals.spend, currency, locale)
                : loading
                  ? "—"
                  : "$0"
            }
          />
        );
      case "kpi_impressions":
        return (
          <KpiCard
            key={id}
            label="Impresiones"
            value={data ? formatNumber(data.totals.impressions, locale) : "—"}
          />
        );
      case "kpi_clicks":
        return (
          <KpiCard
            key={id}
            label="Clics"
            value={data ? formatNumber(data.totals.clicks, locale) : "—"}
            sub={data ? `CTR ${formatPercent(data.totals.ctr)}` : undefined}
          />
        );
      case "kpi_reach":
        return (
          <KpiCard
            key={id}
            label="Alcance"
            value={data ? formatNumber(data.totals.reach, locale) : "—"}
            sub={
              data
                ? `CPC ${formatCurrency(data.totals.cpc, currency, locale)}`
                : undefined
            }
          />
        );
      case "kpi_cpm":
        return (
          <KpiCard
            key={id}
            label="CPM"
            value={data ? formatCurrency(data.totals.cpm, currency, locale) : "—"}
          />
        );
      case "kpi_messages":
        return (
          <KpiCard
            key={id}
            label="Mensajes"
            value={data ? formatNumber(data.totals.messages, locale) : "—"}
          />
        );
      case "kpi_leads":
        return (
          <KpiCard
            key={id}
            label="Leads"
            value={data ? formatNumber(data.totals.leads, locale) : "—"}
          />
        );
      case "kpi_purchases":
        return (
          <KpiCard
            key={id}
            label="Compras"
            value={data ? formatNumber(data.totals.purchases, locale) : "—"}
          />
        );
      case "chart_spend":
        return (
          <div
            key={id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-1"
          >
            <h3 className="mb-4 text-sm font-semibold">Gasto diario</h3>
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                Cargando…
              </div>
            ) : data ? (
              <SpendChart data={data.daily} currency={currency} locale={locale} />
            ) : null}
          </div>
        );
      case "chart_clicks":
        return (
          <div
            key={id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-1"
          >
            <h3 className="mb-4 text-sm font-semibold">Clics por día</h3>
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                Cargando…
              </div>
            ) : data ? (
              <ClicksChart data={data.daily} locale={locale} />
            ) : null}
          </div>
        );
      case "table_campaigns":
        return data ? (
          <DataTable
            key={id}
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
        ) : null;
      case "table_adsets":
        return data ? (
          <DataTable
            key={id}
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
        ) : null;
      default:
        return null;
    }
  }

  const kpiWidgets = widgets.filter((w) => w.id.startsWith("kpi_"));
  const chartWidgets = widgets.filter((w) => w.id.startsWith("chart_"));
  const tableWidgets = widgets.filter((w) => w.id.startsWith("table_"));

  if (needsAuth && !authenticated) {
    return (
      <div style={style}>
        <LoginGate clientName={client.name} onSuccess={() => setAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={style}>
      <AppHeader client={client} active="dashboard">
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
      </AppHeader>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {needsSetup && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-medium">Configurá la API de Meta para ver los reportes</p>
            <p className="mt-1 text-blue-800">
              Andá a{" "}
              <Link href="/settings" className="font-medium underline">
                Configuración
              </Link>{" "}
              y cargá el token y el Ad Account ID.
            </p>
          </div>
        )}

        {error && !needsSetup && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">{error}</p>
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

        {kpiWidgets.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiWidgets.map((w) => renderWidget(w.id))}
          </div>
        )}

        {chartWidgets.length > 0 && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {chartWidgets.map((w) => renderWidget(w.id))}
          </div>
        )}

        {tableWidgets.length > 0 && data && (
          <div className="mt-8 space-y-6">
            {tableWidgets.map((w) => renderWidget(w.id))}
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Dashboard Meta Ads · {client.name}
      </footer>
    </div>
  );
}
