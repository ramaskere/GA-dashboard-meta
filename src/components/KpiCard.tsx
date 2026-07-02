interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  goalTarget?: number;
  goalActual?: number;
  goalLabel?: string;
  editing?: boolean;
  isCurrentMonth?: boolean;
  monthElapsedPct?: number;
  comparisonPct?: number | null;
  comparisonLabel?: string;
}

function progressColor(pct: number) {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 70) return "bg-[var(--client-primary)]";
  if (pct >= 40) return "bg-amber-400";
  return "bg-red-400";
}

function comparisonClass(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || pct === 0) return "text-gray-400";
  return pct > 0 ? "text-emerald-600" : "text-red-500";
}

export function KpiCard({
  label,
  value,
  sub,
  goalTarget,
  goalActual,
  goalLabel,
  editing,
  isCurrentMonth,
  monthElapsedPct,
  comparisonPct,
  comparisonLabel,
}: KpiCardProps) {
  const hasGoal =
    typeof goalTarget === "number" &&
    goalTarget > 0 &&
    typeof goalActual === "number";
  const pct = hasGoal
    ? Math.min(150, Math.round((goalActual / goalTarget) * 100))
    : 0;
  const displayPct = hasGoal ? Math.round((goalActual / goalTarget) * 100) : 0;

  const changeLabel =
    comparisonPct !== undefined && comparisonPct !== null
      ? `${comparisonPct > 0 ? "+" : ""}${comparisonPct}%`
      : null;

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
        editing ? "border-dashed border-[var(--client-primary)]/40 ring-2 ring-[var(--client-primary)]/10" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        {changeLabel && comparisonLabel && (
          <span
            className={`shrink-0 text-xs font-medium ${comparisonClass(comparisonPct)}`}
            title={`vs ${comparisonLabel}`}
          >
            {changeLabel} vs ant.
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#1d1d1f]">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}

      {hasGoal && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {goalLabel || "Meta mensual"}: {goalTarget!.toLocaleString("es-AR")}
            </span>
            <span
              className={`font-medium ${
                displayPct >= 100
                  ? "text-emerald-600"
                  : displayPct >= 70
                    ? "text-[var(--client-primary)]"
                    : "text-amber-600"
              }`}
            >
              {displayPct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${progressColor(displayPct)}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          {isCurrentMonth && monthElapsedPct !== undefined && (
            <p className="text-xs text-gray-400">
              Ritmo del mes: {displayPct}% vs {monthElapsedPct}% esperado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
