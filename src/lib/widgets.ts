export type WidgetId =
  | "kpi_spend"
  | "kpi_impressions"
  | "kpi_clicks"
  | "kpi_reach"
  | "kpi_cpm"
  | "kpi_messages"
  | "kpi_leads"
  | "kpi_purchases"
  | "chart_spend"
  | "chart_clicks"
  | "table_campaigns"
  | "table_adsets";

export interface WidgetDefinition {
  id: WidgetId;
  label: string;
  category: "kpi" | "chart" | "table";
}

export interface WidgetItem {
  id: WidgetId;
  enabled: boolean;
  order: number;
}

export interface WidgetConfig {
  widgets: WidgetItem[];
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { id: "kpi_spend", label: "Gasto total", category: "kpi" },
  { id: "kpi_impressions", label: "Impresiones", category: "kpi" },
  { id: "kpi_clicks", label: "Clics", category: "kpi" },
  { id: "kpi_reach", label: "Alcance", category: "kpi" },
  { id: "kpi_cpm", label: "CPM", category: "kpi" },
  { id: "kpi_messages", label: "Mensajes", category: "kpi" },
  { id: "kpi_leads", label: "Leads", category: "kpi" },
  { id: "kpi_purchases", label: "Compras", category: "kpi" },
  { id: "chart_spend", label: "Gráfico gasto diario", category: "chart" },
  { id: "chart_clicks", label: "Gráfico clics por día", category: "chart" },
  { id: "table_campaigns", label: "Tabla campañas", category: "table" },
  { id: "table_adsets", label: "Tabla ad sets", category: "table" },
];

export function defaultWidgetConfig(): WidgetConfig {
  return {
    widgets: WIDGET_DEFINITIONS.map((w, i) => ({
      id: w.id,
      enabled: true,
      order: i,
    })),
  };
}

export function normalizeWidgetConfig(raw: unknown): WidgetConfig {
  const defaults = defaultWidgetConfig();
  if (!raw || typeof raw !== "object") return defaults;

  const input = raw as { widgets?: unknown };
  if (!Array.isArray(input.widgets)) return defaults;

  const known = new Set(WIDGET_DEFINITIONS.map((w) => w.id));
  const merged = new Map<WidgetId, WidgetItem>();

  for (const item of input.widgets) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: string; enabled?: boolean; order?: number };
    if (!row.id || !known.has(row.id as WidgetId)) continue;
    merged.set(row.id as WidgetId, {
      id: row.id as WidgetId,
      enabled: row.enabled !== false,
      order: typeof row.order === "number" ? row.order : 0,
    });
  }

  for (const def of WIDGET_DEFINITIONS) {
    if (!merged.has(def.id)) {
      merged.set(def.id, {
        id: def.id,
        enabled: true,
        order: merged.size,
      });
    }
  }

  return {
    widgets: Array.from(merged.values()).sort((a, b) => a.order - b.order),
  };
}

export function enabledWidgets(config: WidgetConfig): WidgetItem[] {
  return config.widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);
}

export function widgetLabel(id: WidgetId): string {
  return WIDGET_DEFINITIONS.find((w) => w.id === id)?.label || id;
}
