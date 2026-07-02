"use client";

import { useMemo, useState } from "react";
import {
  COUNTRY_REGIONS,
  countryLabel,
  isValidCountryCode,
} from "@/lib/countries";
import {
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
  const [search, setSearch] = useState("");
  const [customCode, setCustomCode] = useState("");
  const showPixel = needsPixel(objective);
  const showPage = needsPage(objective);

  const filteredRegions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRY_REGIONS;
    return COUNTRY_REGIONS.map((region) => ({
      ...region,
      countries: region.countries.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      ),
    })).filter((r) => r.countries.length > 0);
  }, [search]);

  function toggleCountry(code: string) {
    const has = segmentation.countries.includes(code);
    const countries = has
      ? segmentation.countries.filter((c) => c !== code)
      : [...segmentation.countries, code];
    onChange({ ...segmentation, countries });
  }

  function addCustomCountry() {
    const code = customCode.trim().toUpperCase();
    if (!isValidCountryCode(code)) return;
    if (!segmentation.countries.includes(code)) {
      onChange({ ...segmentation, countries: [...segmentation.countries, code] });
    }
    setCustomCode("");
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Segmentación
      </p>

      <div>
        <label className="text-xs font-medium text-gray-600">Países</label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar país o código ISO (ej. DE, JP)…"
          className={`mt-1 ${fieldCls}`}
        />
        {segmentation.countries.length > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            Seleccionados:{" "}
            {segmentation.countries
              .map((c) => `${countryLabel(c)} (${c})`)
              .join(", ")}
          </p>
        )}
        <div className="mt-3 max-h-48 space-y-3 overflow-y-auto pr-1">
          {filteredRegions.map((region) => (
            <div key={region.id}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {region.label}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {region.countries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCountry(c.code)}
                    className={`rounded-lg border px-2 py-0.5 text-xs transition ${
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
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            placeholder="Código ISO (ej. IT)"
            maxLength={2}
            className={`flex-1 ${fieldCls}`}
          />
          <button
            type="button"
            onClick={addCustomCountry}
            className="rounded-xl border border-gray-200 px-3 text-xs hover:bg-white"
          >
            Agregar
          </button>
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
        <label className="text-xs font-medium text-gray-600">Placements</label>
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
