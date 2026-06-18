"use client";

import {
  COUNTRY_OPTIONS,
  PLACEMENT_OPTIONS,
  PIXEL_EVENT_OPTIONS,
  needsPixel,
  needsPage,
  type AdSetSegmentation,
} from "@/lib/adset-segmentation";

const fieldCls =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--client-primary)]";

interface SegmentationFieldsProps {
  segmentation: AdSetSegmentation;
  onChange: (seg: AdSetSegmentation) => void;
  objective: string;
  pages: Array<{ id: string; name: string }>;
  pixels: Array<{ id: string; name: string }>;
  pageId: string;
  onPageIdChange: (id: string) => void;
}

export function SegmentationFields({
  segmentation,
  onChange,
  objective,
  pages,
  pixels,
  pageId,
  onPageIdChange,
}: SegmentationFieldsProps) {
  const showPixel = needsPixel(objective);
  const showPage = needsPage(objective);

  function toggleCountry(code: string) {
    const has = segmentation.countries.includes(code);
    const countries = has
      ? segmentation.countries.filter((c) => c !== code)
      : [...segmentation.countries, code];
    onChange({ ...segmentation, countries: countries.length ? countries : ["AR"] });
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Segmentación
      </p>

      <div>
        <label className="text-xs font-medium text-gray-600">Países</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COUNTRY_OPTIONS.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => toggleCountry(c.code)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                segmentation.countries.includes(c.code)
                  ? "border-[var(--client-primary)] bg-blue-50 text-[var(--client-primary)]"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Edad mínima</label>
          <input
            type="number"
            min={18}
            max={65}
            value={segmentation.ageMin}
            onChange={(e) =>
              onChange({ ...segmentation, ageMin: Number(e.target.value) || 18 })
            }
            className={`mt-1 ${fieldCls}`}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Edad máxima</label>
          <input
            type="number"
            min={18}
            max={65}
            value={segmentation.ageMax}
            onChange={(e) =>
              onChange({ ...segmentation, ageMax: Number(e.target.value) || 65 })
            }
            className={`mt-1 ${fieldCls}`}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">Ubicación / placements</label>
        <select
          value={segmentation.placement}
          onChange={(e) =>
            onChange({
              ...segmentation,
              placement: e.target.value as AdSetSegmentation["placement"],
            })
          }
          className={`mt-1 ${fieldCls}`}
        >
          {PLACEMENT_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {showPage && pages.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-600">
            Página de Facebook {objective === "OUTCOME_LEADS" ? "(requerida)" : ""}
          </label>
          <select
            value={pageId}
            onChange={(e) => {
              onPageIdChange(e.target.value);
              onChange({ ...segmentation, pageId: e.target.value });
            }}
            className={`mt-1 ${fieldCls}`}
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showPixel && (
        <>
          <div>
            <label className="text-xs font-medium text-gray-600">
              Pixel de Meta (requerido para Ventas)
            </label>
            <select
              required
              value={segmentation.pixelId || ""}
              onChange={(e) =>
                onChange({ ...segmentation, pixelId: e.target.value })
              }
              className={`mt-1 ${fieldCls}`}
            >
              <option value="">Elegí un pixel</option>
              {pixels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
            {pixels.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                No se encontraron pixels en la cuenta. Creá uno en Meta Events Manager.
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              Evento de conversión
            </label>
            <select
              value={segmentation.pixelEvent || "PURCHASE"}
              onChange={(e) =>
                onChange({ ...segmentation, pixelEvent: e.target.value })
              }
              className={`mt-1 ${fieldCls}`}
            >
              {PIXEL_EVENT_OPTIONS.map((ev) => (
                <option key={ev.value} value={ev.value}>
                  {ev.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
