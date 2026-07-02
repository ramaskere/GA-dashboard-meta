"use client";

import { useState } from "react";
import {
  WIDGET_DEFINITIONS,
  WIDGET_CATEGORIES,
  getGoalsForMonth,
  type WidgetConfig,
  type WidgetItem,
  type DashboardGoals,
  type GoalMetricId,
  type DashboardFeatures,
} from "@/lib/widgets";
import { GOAL_METRIC_DEFS } from "@/lib/goals";
import { formatMonthLabel } from "@/lib/months";

interface DashboardEditorPanelProps {
  config: WidgetConfig;
  selectedMonth: string;
  onSave: (config: WidgetConfig) => Promise<void>;
  onClose: () => void;
  currency: string;
}

type EditorTab = "widgets" | "goals" | "options";

export function DashboardEditorPanel({
  config,
  selectedMonth,
  onSave,
  onClose,
  currency,
}: DashboardEditorPanelProps) {
  const [tab, setTab] = useState<EditorTab>("widgets");
  const [widgets, setWidgets] = useState<WidgetItem[]>(
    [...config.widgets].sort((a, b) => a.order - b.order)
  );
  const [goalsByMonth, setGoalsByMonth] = useState<Record<string, DashboardGoals>>(
    config.goalsByMonth || {}
  );
  const [features, setFeatures] = useState<DashboardFeatures>(
    config.features || { campaignsEnabled: true }
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const monthGoals = goalsByMonth[selectedMonth] || getGoalsForMonth(config, selectedMonth) || {};

  function toggleWidget(id: WidgetItem["id"]) {
    setWidgets((list) =>
      list.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  }

  function moveWidget(id: WidgetItem["id"], dir: -1 | 1) {
    setWidgets((list) => {
      const sorted = [...list].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= sorted.length) return list;
      const a = sorted[idx];
      const b = sorted[next];
      return list.map((w) => {
        if (w.id === a.id) return { ...w, order: b.order };
        if (w.id === b.id) return { ...w, order: a.order };
        return w;
      });
    });
  }

  function setGoal(metric: GoalMetricId, value: string) {
    const n = value === "" ? undefined : Number(value);
    setGoalsByMonth((prev) => {
      const next = { ...prev };
      const month = { ...(next[selectedMonth] || {}) };
      if (n === undefined || !Number.isFinite(n) || n <= 0) {
        delete month[metric];
      } else {
        month[metric] = n;
      }
      if (Object.keys(month).length === 0) {
        delete next[selectedMonth];
      } else {
        next[selectedMonth] = month;
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await onSave({ widgets, goalsByMonth, features });
      setMessage({ type: "ok", text: "Dashboard actualizado" });
      setTimeout(onClose, 600);
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Error al guardar",
      });
    } finally {
      setSaving(false);
    }
  }

  const sorted = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar editor"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--client-primary)]">
                Modo editor
              </p>
              <h2 className="text-lg font-semibold text-[#1d1d1f]">
                Personalizar dashboard
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Widgets, metas de {formatMonthLabel(selectedMonth)} y opciones.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-500 hover:bg-gray-50"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
            {(
              [
                { id: "widgets" as const, label: "Widgets" },
                { id: "goals" as const, label: "Metas" },
                { id: "options" as const, label: "Opciones" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  tab === t.id
                    ? "bg-white text-[var(--client-primary)] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "widgets" &&
            WIDGET_CATEGORIES.map((cat) => {
              const items = sorted.filter((w) => {
                const def = WIDGET_DEFINITIONS.find((d) => d.id === w.id);
                return def?.category === cat.id;
              });
              if (!items.length) return null;
              return (
                <section key={cat.id} className="mb-6">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {cat.label}
                  </h3>
                  <div className="space-y-2">
                    {items.map((w) => {
                      const def = WIDGET_DEFINITIONS.find((d) => d.id === w.id);
                      const globalIdx = sorted.findIndex((x) => x.id === w.id);
                      return (
                        <div
                          key={w.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                            w.enabled
                              ? "border-[var(--client-primary)]/30 bg-blue-50/40"
                              : "border-gray-100 bg-gray-50/50 opacity-70"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleWidget(w.id)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                              w.enabled
                                ? "border-[var(--client-primary)] bg-[var(--client-primary)] text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {w.enabled ? "✓" : ""}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {def?.label}
                            </p>
                            <p className="text-xs text-gray-400">{def?.description}</p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              disabled={globalIdx === 0}
                              onClick={() => moveWidget(w.id, -1)}
                              className="rounded border border-gray-200 px-1.5 py-0.5 text-xs disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={globalIdx === sorted.length - 1}
                              onClick={() => moveWidget(w.id, 1)}
                              className="rounded border border-gray-200 px-1.5 py-0.5 text-xs disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

          {tab === "goals" && (
            <div className="space-y-4">
              <p className="mt-1 text-xs text-gray-500">
                Metas de <strong>{formatMonthLabel(selectedMonth)}</strong>. Cada mes
                puede tener objetivos distintos. Dejá vacío para ocultar la barra.
              </p>
              {GOAL_METRIC_DEFS.map((m) => (
                <label key={m.id} className="block">
                  <span className="text-sm font-medium text-gray-700">{m.label}</span>
                  <div className="relative mt-1">
                    {m.unit === "currency" && (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {currency}
                      </span>
                    )}
                    <input
                      type="number"
                      min={0}
                      step={m.unit === "currency" ? 1 : 1}
                      value={monthGoals[m.id] ?? ""}
                      onChange={(e) => setGoal(m.id, e.target.value)}
                      placeholder="Sin meta"
                      className={`w-full rounded-xl border border-gray-200 py-2.5 text-sm outline-none focus:border-[var(--client-primary)] ${
                        m.unit === "currency" ? "pl-12 pr-4" : "px-4"
                      }`}
                    />
                  </div>
                </label>
              ))}
            </div>
          )}

          {tab === "options" && (
            <div className="space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 p-4">
                <input
                  type="checkbox"
                  checked={features.campaignsEnabled !== false}
                  onChange={(e) =>
                    setFeatures((f) => ({
                      ...f,
                      campaignsEnabled: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Habilitar sección Campañas
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Desactivá esto si solo usás reportes (ej. sin Business Manager
                    verificado). Oculta el menú Campañas para todos los usuarios.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          {message && (
            <p
              className={`mb-3 text-sm ${
                message.type === "ok" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-[var(--client-primary)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
