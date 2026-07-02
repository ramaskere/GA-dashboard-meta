import type { MetricTotals } from "./comparison";
import { formatCurrency, formatNumber, formatPercent } from "./format";

export interface ExportReportInput {
  clientName: string;
  periodLabel: string;
  currency: string;
  locale: string;
  totals: MetricTotals & { ctr: number; cpc: number; cpm: number };
  campaigns: Array<{
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
  }>;
  goals?: Partial<MetricTotals>;
  comparisonLabel?: string;
  comparison?: Partial<Record<keyof MetricTotals, number | null>>;
}

function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportReportCsv(input: ExportReportInput): void {
  const lines: string[] = [
    `Reporte Meta Ads - ${input.clientName}`,
    `Período,${csvEscape(input.periodLabel)}`,
    "",
    "Métrica,Valor",
    `Gasto,${input.totals.spend}`,
    `Impresiones,${input.totals.impressions}`,
    `Clics,${input.totals.clicks}`,
    `Alcance,${input.totals.reach}`,
    `Mensajes,${input.totals.messages}`,
    `Leads,${input.totals.leads}`,
    `Compras,${input.totals.purchases}`,
    `CTR,${input.totals.ctr}`,
    `CPC,${input.totals.cpc}`,
    `CPM,${input.totals.cpm}`,
    "",
    "Campaña,Gasto,Impresiones,Clics,CTR,CPC",
    ...input.campaigns.map((c) =>
      [
        csvEscape(c.name),
        c.spend,
        c.impressions,
        c.clicks,
        c.ctr.toFixed(2),
        c.cpc.toFixed(2),
      ].join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-${input.periodLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportPdf(input: ExportReportInput): void {
  const rows = [
    ["Gasto", formatCurrency(input.totals.spend, input.currency, input.locale)],
    ["Impresiones", formatNumber(input.totals.impressions, input.locale)],
    ["Clics", formatNumber(input.totals.clicks, input.locale)],
    ["Alcance", formatNumber(input.totals.reach, input.locale)],
    ["Mensajes", formatNumber(input.totals.messages, input.locale)],
    ["Leads", formatNumber(input.totals.leads, input.locale)],
    ["Compras", formatNumber(input.totals.purchases, input.locale)],
    ["CTR", formatPercent(input.totals.ctr)],
    ["CPC", formatCurrency(input.totals.cpc, input.currency, input.locale)],
    ["CPM", formatCurrency(input.totals.cpm, input.currency, input.locale)],
  ];

  const campaignRows = input.campaigns
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td align="right">${formatCurrency(c.spend, input.currency, input.locale)}</td>
        <td align="right">${formatNumber(c.impressions, input.locale)}</td>
        <td align="right">${formatNumber(c.clicks, input.locale)}</td>
        <td align="right">${formatPercent(c.ctr)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reporte ${escapeHtml(input.clientName)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 32px; color: #1d1d1f; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { border-bottom: 1px solid #eee; padding: 8px 6px; text-align: left; }
  th { font-size: 11px; text-transform: uppercase; color: #86868b; }
  h2 { font-size: 14px; margin: 28px 0 8px; }
</style></head><body>
  <h1>${escapeHtml(input.clientName)} — Meta Ads</h1>
  <p class="sub">${escapeHtml(input.periodLabel)} · Generado ${new Date().toLocaleString(input.locale)}</p>
  <h2>Resumen</h2>
  <table>
    <thead><tr><th>Métrica</th><th>Valor</th></tr></thead>
    <tbody>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</tbody>
  </table>
  <h2>Campañas</h2>
  <table>
    <thead><tr><th>Campaña</th><th>Gasto</th><th>Impresiones</th><th>Clics</th><th>CTR</th></tr></thead>
    <tbody>${campaignRows || "<tr><td colspan='5'>Sin datos</td></tr>"}</tbody>
  </table>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Permití ventanas emergentes para exportar el PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
