"use client";

import type { ExportReportInput } from "@/lib/export-report";
import { exportReportCsv, exportReportPdf } from "@/lib/export-report";

interface ExportMenuProps {
  report: ExportReportInput | null;
  disabled?: boolean;
}

export function ExportMenu({ report, disabled }: ExportMenuProps) {
  if (!report) return null;

  return (
    <div className="flex gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => exportReportCsv(report)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        title="Descargar Excel (CSV)"
      >
        Excel
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => exportReportPdf(report)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        title="Imprimir / guardar como PDF"
      >
        PDF
      </button>
    </div>
  );
}
