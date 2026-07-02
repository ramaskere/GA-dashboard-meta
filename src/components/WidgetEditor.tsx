"use client";

import { useState } from "react";
import {
  WIDGET_DEFINITIONS,
  type WidgetConfig,
  type WidgetItem,
} from "@/lib/widgets";

interface WidgetEditorProps {
  config: WidgetConfig;
  onSave: (config: WidgetConfig) => Promise<void>;
  disabled?: boolean;
}

export function WidgetEditor({ config, onSave, disabled }: WidgetEditorProps) {
  const [widgets, setWidgets] = useState<WidgetItem[]>(
    [...config.widgets].sort((a, b) => a.order - b.order)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(id: WidgetItem["id"]) {
    setWidgets((list) =>
      list.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  }

  function move(id: WidgetItem["id"], dir: -1 | 1) {
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

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await onSave({ widgets });
      setMessage("Widgets guardados");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al guardar");
    }
    setSaving(false);
  }

  const sorted = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-[#1d1d1f]">Widgets del dashboard</h2>
        <p className="mt-1 text-xs text-gray-500">
          Activá, desactivá y ordená widgets. Para metas y vista previa, usá{" "}
          <strong>Personalizar</strong> en el dashboard principal.
        </p>

      <ul className="mt-4 space-y-2">
        {sorted.map((w, i) => {
          const def = WIDGET_DEFINITIONS.find((d) => d.id === w.id);
          return (
            <li
              key={w.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={w.enabled}
                onChange={() => toggle(w.id)}
                disabled={disabled}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="flex-1 text-sm">{def?.label || w.id}</span>
              <span className="text-xs uppercase text-gray-400">{def?.category}</span>
              <button
                type="button"
                disabled={disabled || i === 0}
                onClick={() => move(w.id, -1)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={disabled || i === sorted.length - 1}
                onClick={() => move(w.id, 1)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs disabled:opacity-30"
              >
                ↓
              </button>
            </li>
          );
        })}
      </ul>

      {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={disabled || saving}
        className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {saving ? "Guardando widgets…" : "Guardar widgets"}
      </button>
    </div>
  );
}
