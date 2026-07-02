import type { DashboardGoals, GoalMetricId } from "./widgets";
import { getGoalsForMonth, type WidgetConfig } from "./widgets";

export const GOAL_METRIC_DEFS: Array<{
  id: GoalMetricId;
  label: string;
  kpiWidget: string;
  unit: "currency" | "number";
}> = [
  { id: "spend", label: "Inversión (gasto)", kpiWidget: "kpi_spend", unit: "currency" },
  { id: "impressions", label: "Impresiones", kpiWidget: "kpi_impressions", unit: "number" },
  { id: "clicks", label: "Clics", kpiWidget: "kpi_clicks", unit: "number" },
  { id: "reach", label: "Alcance", kpiWidget: "kpi_reach", unit: "number" },
  { id: "messages", label: "Mensajes", kpiWidget: "kpi_messages", unit: "number" },
  { id: "leads", label: "Leads", kpiWidget: "kpi_leads", unit: "number" },
  { id: "purchases", label: "Compras", kpiWidget: "kpi_purchases", unit: "number" },
];

export function goalProgress(
  actual: number,
  target?: number,
  expectedPct?: number
) {
  if (!target || target <= 0) return null;
  const pct = Math.round((actual / target) * 100);
  const onPace =
    typeof expectedPct === "number" && expectedPct < 100
      ? pct >= expectedPct
      : pct >= 100;
  return {
    pct,
    remaining: Math.max(0, target - actual),
    exceeded: actual > target,
    onPace,
    expectedPct,
  };
}

export function activeGoals(goals?: DashboardGoals) {
  if (!goals) return [];
  return GOAL_METRIC_DEFS.filter((d) => {
    const v = goals[d.id];
    return typeof v === "number" && v > 0;
  }).map((d) => ({ ...d, target: goals[d.id] as number }));
}

export function activeGoalsForMonth(config: WidgetConfig, monthKey: string) {
  return activeGoals(getGoalsForMonth(config, monthKey));
}

export interface PaceAlertItem {
  id: GoalMetricId;
  label: string;
  pct: number;
  expectedPct: number;
  severity: "warning" | "critical";
}

/** Métricas con meta que van por debajo del ritmo esperado del mes. */
export function behindPaceAlerts(
  config: WidgetConfig,
  monthKey: string,
  totals: Record<GoalMetricId, number>,
  monthElapsedPct: number,
  isCurrentMonth: boolean
): PaceAlertItem[] {
  if (!isCurrentMonth || monthElapsedPct >= 95) return [];

  const goals = getGoalsForMonth(config, monthKey);
  if (!goals) return [];

  const alerts: PaceAlertItem[] = [];

  for (const def of GOAL_METRIC_DEFS) {
    const target = goals[def.id];
    if (!target || target <= 0) continue;
    const actual = totals[def.id] ?? 0;
    const prog = goalProgress(actual, target, monthElapsedPct);
    if (!prog || prog.onPace) continue;

    const gap = monthElapsedPct - prog.pct;
    alerts.push({
      id: def.id,
      label: def.label,
      pct: prog.pct,
      expectedPct: monthElapsedPct,
      severity: gap >= 25 ? "critical" : "warning",
    });
  }

  return alerts.sort((a, b) => b.expectedPct - b.pct - (a.expectedPct - a.pct));
}
