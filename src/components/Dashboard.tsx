"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  getGoalsForMonth,
  campaignsEnabled,
  type WidgetConfig,
  type WidgetId,
  type DashboardGoals,
  type GoalMetricId,
} from "@/lib/widgets";
import { behindPaceAlerts } from "@/lib/goals";
import { KpiCard } from "./KpiCard";
import { SpendChart, ClicksChart, CumulativeSpendChart } from "./Charts";
import { DataTable } from "./DataTable";
import { LoginGate } from "./LoginGate";
import { AppHeader } from "./AppHeader";
import { DashboardEditorPanel } from "./DashboardEditorPanel";
import { GoalsSummary } from "./GoalsSummary";
import { PaceAlertBanner } from "./PaceAlertBanner";
import { ExportMenu } from "./ExportMenu";
import {
  currentMonthKey,
  listMonthOptions,
} from "@/lib/months";
import type { ExportReportInput } from "@/lib/export-report";

const MONTH_OPTIONS = listMonthOptions(12);

const KPI_GOAL_KEY: Partial<Record<WidgetId, GoalMetricId>> = {
  kpi_spend: "spend",
  kpi_impressions: "impressions",
  kpi_clicks: "clicks",
  kpi_reach: "reach",
  kpi_messages: "messages",
  kpi_leads: "leads",
  kpi_purchases: "purchases",
};

interface InsightsData {
  client: { id: string; name: string; currency: string };
  account: { name: string; status: number; timezone: string };
  widgetConfig?: WidgetConfig;
  period?: {
    type: "month" | "preset";
    month?: string;
    label?: string;
    isCurrentMonth?: boolean;
    monthElapsedPct?: number;
  };
  previousPeriod?: {
    month: string;
    label: string;
    changePct: Partial<Record<GoalMetricId, number | null>>;
  };
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

interface DashboardProps {
  client: ClientConfig;
  availableClients?: Pick<ClientConfig, "id" | "name">[];
}

export function Dashboard({ client, availableClients = [] }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [allCampaigns, setAllCampaigns] = useState<InsightsData["campaigns"]>([]);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetch("/api/admin-auth")
      .then((res) => setIsAdmin(res.ok))
      .catch(() => setIsAdmin(false));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ month: selectedMonth });
      if (campaignFilter !== "all") {
        params.set("campaignId", campaignFilter);
      }
      const res = await fetch(`/api/insights?${params}`);

      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }

      const json = await res.json();

      if (res.status === 503 && json.needsSetup) {
        setNeedsSetup(true);
        setError(json.error || "API no configurada");
        setData(null);
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
    } catch {
      setError("No se pudo conectar con el servidor. ¿Está corriendo npm run dev?");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, campaignFilter]);

  useEffect(() => {
    if (!needsAuth || authenticated) fetchData();
  }, [fetchData, needsAuth, authenticated]);

  useEffect(() => {
    if (data?.campaigns?.length && campaignFilter === "all") {
      setAllCampaigns(data.campaigns);
    }
  }, [data?.campaigns, campaignFilter]);

  const style = clientCssVars(client);
  const currency = data?.client.currency || client.currency;
  const locale = client.locale;
  const widgetConfig = data?.widgetConfig || defaultWidgetConfig();
  const widgets = enabledWidgets(widgetConfig);
  const monthGoals = getGoalsForMonth(widgetConfig, selectedMonth);
  const showCampaigns = campaignsEnabled(widgetConfig);

  const periodLabel =
    data?.period?.label ||
    MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ||
    selectedMonth;
  const isCurrentMonth =
    data?.period?.isCurrentMonth ?? selectedMonth === currentMonthKey();
  const monthElapsedPct = data?.period?.monthElapsedPct;
  const previousLabel = data?.previousPeriod?.label;
  const changePct = data?.previousPeriod?.changePct;

  const paceAlerts = useMemo(() => {
    if (!data || monthElapsedPct === undefined) return [];
    return behindPaceAlerts(
      widgetConfig,
      selectedMonth,
      data.totals,
      monthElapsedPct,
      isCurrentMonth
    );
  }, [data, widgetConfig, selectedMonth, monthElapsedPct, isCurrentMonth]);

  const exportReport: ExportReportInput | null = useMemo(() => {
    if (!data) return null;
    return {
      clientName: data.client.name,
      periodLabel,
      currency,
      locale,
      totals: data.totals,
      campaigns: data.campaigns,
      goals: monthGoals,
      comparisonLabel: previousLabel,
      comparison: changePct,
    };
  }, [data, periodLabel, currency, locale, monthGoals, previousLabel, changePct]);

  async function saveDashboardConfig(config: WidgetConfig) {
    const res = await fetch("/api/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetConfig: config }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "No se pudo guardar");
    }
    setData((prev) => (prev ? { ...prev, widgetConfig: json.widgetConfig } : prev));
  }

  function kpiComparison(id: WidgetId) {
    const key = KPI_GOAL_KEY[id];
    if (!key || !changePct) return {};
    return {
      comparisonPct: changePct[key],
      comparisonLabel: previousLabel,
    };
  }

  function kpiGoalProps(id: WidgetId) {
    const key = KPI_GOAL_KEY[id];
    if (!key || !data || !monthGoals?.[key]) return { ...kpiComparison(id) };
    return {
      goalTarget: monthGoals[key],
      goalActual: data.totals[key],
      goalLabel: "Meta mensual",
      editing: editMode,
      isCurrentMonth,
      monthElapsedPct,
      ...kpiComparison(id),
    };
  }

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
            {...kpiGoalProps(id)}
          />
        );
      case "kpi_impressions":
        return (
          <KpiCard
            key={id}
            label="Impresiones"
            value={data ? formatNumber(data.totals.impressions, locale) : "—"}
            {...kpiGoalProps(id)}
          />
        );
      case "kpi_clicks":
        return (
          <KpiCard
            key={id}
            label="Clics"
            value={data ? formatNumber(data.totals.clicks, locale) : "—"}
            sub={data ? `CTR ${formatPercent(data.totals.ctr)}` : undefined}
            {...kpiGoalProps(id)}
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
            {...kpiGoalProps(id)}
          />
        );
      case "kpi_cpm":
        return (
          <KpiCard
            key={id}
            label="CPM"
            value={data ? formatCurrency(data.totals.cpm, currency, locale) : "—"}
            {...kpiComparison(id)}
          />
        );
      case "kpi_messages":
        return (
          <KpiCard
            key={id}
            label="Mensajes"
            value={data ? formatNumber(data.totals.messages, locale) : "—"}
            {...kpiGoalProps(id)}
          />
        );
      case "kpi_leads":
        return (
          <KpiCard
            key={id}
            label="Leads"
            value={data ? formatNumber(data.totals.leads, locale) : "—"}
            {...kpiGoalProps(id)}
          />
        );
      case "kpi_purchases":
        return (
          <KpiCard
            key={id}
            label="Compras"
            value={data ? formatNumber(data.totals.purchases, locale) : "—"}
            {...kpiGoalProps(id)}
          />
        );
      case "chart_spend":
        return (
          <div
            key={id}
            className={`rounded-2xl border bg-white p-5 shadow-sm lg:col-span-1 ${
              editMode
                ? "border-dashed border-[var(--client-primary)]/40"
                : "border-gray-100"
            }`}
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
            className={`rounded-2xl border bg-white p-5 shadow-sm lg:col-span-1 ${
              editMode
                ? "border-dashed border-[var(--client-primary)]/40"
                : "border-gray-100"
            }`}
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
      case "chart_cumulative":
        return (
          <div
            key={id}
            className={`rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2 ${
              editMode
                ? "border-dashed border-[var(--client-primary)]/40"
                : "border-gray-100"
            }`}
          >
            <h3 className="mb-1 text-sm font-semibold">Gasto acumulado vs meta</h3>
            <p className="mb-4 text-xs text-gray-400">
              Línea punteada = ritmo lineal hacia la meta de inversión del mes.
            </p>
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                Cargando…
              </div>
            ) : data ? (
              <CumulativeSpendChart
                data={data.daily}
                monthKey={selectedMonth}
                spendGoal={monthGoals?.spend}
                currency={currency}
                locale={locale}
              />
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
            rows={(campaignFilter === "all"
              ? data.campaigns
              : data.campaigns.filter((c) => c.id === campaignFilter)
            ).map((c) => ({
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
      <AppHeader
        client={client}
        active="dashboard"
        campaignsEnabled={showCampaigns}
        availableClients={availableClients}
        isAdmin={isAdmin}
      >
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--client-primary)]"
          aria-label="Mes"
        >
          {MONTH_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.isCurrent ? `${m.label} (actual)` : m.label}
            </option>
          ))}
        </select>
        {allCampaigns.length > 0 && (
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="max-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--client-primary)]"
            aria-label="Campaña"
          >
            <option value="all">Todas las campañas</option>
            {allCampaigns.map((c) => (
              <option key={c.id || c.name} value={c.id || ""}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <ExportMenu report={exportReport} disabled={loading || !data} />
        <button
          onClick={fetchData}
          disabled={loading}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "…" : "↻"}
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="rounded-xl border border-[var(--client-primary)]/30 bg-blue-50 px-3 py-2 text-sm font-medium text-[var(--client-primary)] hover:bg-blue-100"
          >
            ✎ Personalizar
          </button>
        )}
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
            {campaignFilter !== "all" && (
              <span className="ml-2 text-[var(--client-primary)]">· Filtro por campaña activo</span>
            )}
            {data.updatedAt && (
              <span className="ml-2">
                · Actualizado {new Date(data.updatedAt).toLocaleString(locale)}
              </span>
            )}
          </p>
        )}

        {isCurrentMonth && monthElapsedPct !== undefined && paceAlerts.length > 0 && (
          <PaceAlertBanner
            alerts={paceAlerts}
            periodLabel={periodLabel}
            monthElapsedPct={monthElapsedPct}
          />
        )}

        {data && (
          <GoalsSummary
            goals={monthGoals}
            totals={data.totals}
            currency={currency}
            locale={locale}
            periodLabel={periodLabel}
            isCurrentMonth={isCurrentMonth}
            monthElapsedPct={monthElapsedPct}
            changePct={changePct}
            previousLabel={previousLabel}
          />
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

      {editMode && (
        <DashboardEditorPanel
          config={widgetConfig}
          selectedMonth={selectedMonth}
          currency={currency}
          onSave={saveDashboardConfig}
          onClose={() => setEditMode(false)}
        />
      )}

      <footer className="mt-12 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Dashboard Meta Ads · {client.name}
      </footer>
    </div>
  );
}
