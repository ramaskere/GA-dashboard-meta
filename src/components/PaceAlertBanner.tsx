"use client";

import type { PaceAlertItem } from "@/lib/goals";

interface PaceAlertBannerProps {
  alerts: PaceAlertItem[];
  periodLabel: string;
  monthElapsedPct: number;
}

export function PaceAlertBanner({
  alerts,
  periodLabel,
  monthElapsedPct,
}: PaceAlertBannerProps) {
  if (!alerts.length) return null;

  const critical = alerts.filter((a) => a.severity === "critical");
  const isCritical = critical.length > 0;

  return (
    <div
      className={`mb-6 rounded-2xl border p-4 ${
        isCritical
          ? "border-red-200 bg-red-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          isCritical ? "text-red-900" : "text-amber-900"
        }`}
      >
        {isCritical ? "⚠ Atención: metas en riesgo" : "⏱ Ritmo por debajo de la meta"}
      </p>
      <p
        className={`mt-1 text-xs ${
          isCritical ? "text-red-800" : "text-amber-800"
        }`}
      >
        {periodLabel} · {monthElapsedPct}% del mes transcurrido. Estas métricas van
        atrasadas respecto al ritmo esperado:
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {alerts.map((a) => (
          <li
            key={a.id}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              a.severity === "critical"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {a.label}: {a.pct}% (esperado ~{a.expectedPct}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
