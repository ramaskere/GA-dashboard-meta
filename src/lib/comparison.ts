/** Variación porcentual vs período anterior. */
export function percentChange(
  current: number,
  previous: number
): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current > 0 ? 100 : current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function formatChangeLabel(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "—";
  if (pct === 0) return "0%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

export function changeTone(pct: number | null | undefined): "up" | "down" | "flat" {
  if (pct === null || pct === undefined || pct === 0) return "flat";
  return pct > 0 ? "up" : "down";
}

export interface MetricTotals {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  messages: number;
  leads: number;
  purchases: number;
}

export function buildComparison(
  current: MetricTotals,
  previous: MetricTotals
): Record<keyof MetricTotals, number | null> {
  return {
    spend: percentChange(current.spend, previous.spend),
    impressions: percentChange(current.impressions, previous.impressions),
    clicks: percentChange(current.clicks, previous.clicks),
    reach: percentChange(current.reach, previous.reach),
    messages: percentChange(current.messages, previous.messages),
    leads: percentChange(current.leads, previous.leads),
    purchases: percentChange(current.purchases, previous.purchases),
  };
}
