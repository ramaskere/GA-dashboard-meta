"use client";

import type { DashboardGoals } from "@/lib/widgets";
import { activeGoals, goalProgress } from "@/lib/goals";
import { formatChangeLabel } from "@/lib/comparison";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { GoalMetricId } from "@/lib/widgets";

interface GoalsSummaryProps {
  goals?: DashboardGoals;
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    messages: number;
    leads: number;
    purchases: number;
  };
  currency: string;
  locale: string;
  periodLabel: string;
  isCurrentMonth?: boolean;
  monthElapsedPct?: number;
  changePct?: Partial<Record<GoalMetricId, number | null>>;
  previousLabel?: string;
}

export function GoalsSummary({
  goals,
  totals,
  currency,
  locale,
  periodLabel,
  isCurrentMonth,
  monthElapsedPct,
  changePct,
  previousLabel,
}: GoalsSummaryProps) {
  const items = activeGoals(goals);
  if (!items.length) return null;

  const actuals: Record<string, number> = totals;

  return (
    <div className="mb-6 rounded-2xl border border-[var(--client-primary)]/20 bg-gradient-to-r from-blue-50/80 to-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--client-primary)]">
        Metas mensuales · {periodLabel}
      </p>
      {previousLabel && changePct && (
        <p className="mt-1 text-xs text-gray-500">
          Comparativa vs {previousLabel} en cada métrica con meta.
        </p>
      )}
      {isCurrentMonth && monthElapsedPct !== undefined && (
        <p className="mt-1 text-xs text-gray-500">
          Mes en curso: {monthElapsedPct}% del mes transcurrido — compará si vas al ritmo.
        </p>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const actual = actuals[item.id] ?? 0;
          const prog = goalProgress(
            actual,
            item.target,
            isCurrentMonth ? monthElapsedPct : undefined
          )!;
          const delta = changePct?.[item.id];
          const formatted =
            item.unit === "currency"
              ? formatCurrency(actual, currency, locale)
              : formatNumber(actual, locale);
          const targetFormatted =
            item.unit === "currency"
              ? formatCurrency(item.target, currency, locale)
              : formatNumber(item.target, locale);

          return (
            <div key={item.id} className="rounded-xl bg-white/80 px-3 py-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-600">{item.label}</span>
                <div className="flex items-center gap-2">
                  {delta !== undefined && previousLabel && (
                    <span
                      className={`text-xs font-medium ${
                        delta === null || delta === 0
                          ? "text-gray-400"
                          : delta > 0
                            ? "text-emerald-600"
                            : "text-red-500"
                      }`}
                    >
                      {formatChangeLabel(delta)}
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      prog.pct >= 100
                        ? "text-emerald-600"
                        : prog.pct >= 70
                          ? "text-[var(--client-primary)]"
                          : "text-amber-600"
                    }`}
                  >
                    {prog.pct}%
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm font-semibold text-gray-900">{formatted}</p>
              <p className="text-xs text-gray-400">Meta mensual {targetFormatted}</p>
              {isCurrentMonth && monthElapsedPct !== undefined && (
                <p
                  className={`text-xs ${
                    prog.onPace ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {prog.onPace ? "✓ Al ritmo" : "↓ Por debajo del ritmo"} (esperado ~
                  {monthElapsedPct}%)
                </p>
              )}
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${
                    prog.pct >= 100
                      ? "bg-emerald-500"
                      : prog.pct >= 70
                        ? "bg-[var(--client-primary)]"
                        : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, prog.pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
