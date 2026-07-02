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
  | "chart_cumulative"
  | "table_campaigns"
  | "table_adsets";

export type GoalMetricId =
  | "spend"
  | "impressions"
  | "clicks"
  | "reach"
  | "messages"
  | "leads"
  | "purchases";

export interface DashboardGoals {
  spend?: number;
  impressions?: number;
  clicks?: number;
  reach?: number;
  messages?: number;
  leads?: number;
  purchases?: number;
}

export interface DashboardFeatures {
  /** Si es false, oculta la sección Campañas del menú. */
  campaignsEnabled?: boolean;
}

export interface WidgetDefinition {
  id: WidgetId;
  label: string;
  description: string;
  category: "kpi" | "chart" | "table";
}

export interface WidgetItem {
  id: WidgetId;
  enabled: boolean;
  order: number;
}

export interface WidgetConfig {
  widgets: WidgetItem[];
  /** @deprecated Usar goalsByMonth */
  goals?: DashboardGoals;
  goalsByMonth?: Record<string, DashboardGoals>;
  features?: DashboardFeatures;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { id: "kpi_spend", label: "Gasto total", description: "Inversión del período", category: "kpi" },
  { id: "kpi_impressions", label: "Impresiones", description: "Veces que se mostró el anuncio", category: "kpi" },
  { id: "kpi_clicks", label: "Clics", description: "Clics y CTR", category: "kpi" },
  { id: "kpi_reach", label: "Alcance", description: "Personas únicas alcanzadas", category: "kpi" },
  { id: "kpi_cpm", label: "CPM", description: "Costo por mil impresiones", category: "kpi" },
  { id: "kpi_messages", label: "Mensajes", description: "Conversaciones iniciadas", category: "kpi" },
  { id: "kpi_leads", label: "Leads", description: "Leads generados", category: "kpi" },
  { id: "kpi_purchases", label: "Compras", description: "Compras atribuidas", category: "kpi" },
  { id: "chart_spend", label: "Gasto diario", description: "Evolución de inversión", category: "chart" },
  { id: "chart_clicks", label: "Clics por día", description: "Evolución de clics", category: "chart" },
  { id: "chart_cumulative", label: "Gasto acumulado", description: "Acumulado vs meta proyectada", category: "chart" },
  { id: "table_campaigns", label: "Tabla campañas", description: "Detalle por campaña", category: "table" },
  { id: "table_adsets", label: "Tabla ad sets", description: "Detalle por ad set", category: "table" },
];

const GOAL_KEYS: GoalMetricId[] = [
  "spend",
  "impressions",
  "clicks",
  "reach",
  "messages",
  "leads",
  "purchases",
];

function hasAnyGoal(goals: DashboardGoals): boolean {
  return GOAL_KEYS.some((key) => {
    const v = goals[key];
    return typeof v === "number" && v > 0;
  });
}

function normalizeGoals(raw: unknown): DashboardGoals | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const input = raw as Record<string, unknown>;
  const goals: DashboardGoals = {};

  for (const key of GOAL_KEYS) {
    const v = Number(input[key]);
    if (Number.isFinite(v) && v > 0) {
      goals[key] = v;
    }
  }

  return hasAnyGoal(goals) ? goals : undefined;
}

function normalizeGoalsByMonth(raw: unknown): Record<string, DashboardGoals> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const input = raw as Record<string, unknown>;
  const out: Record<string, DashboardGoals> = {};

  for (const [month, value] of Object.entries(input)) {
    const goals = normalizeGoals(value);
    if (goals) out[month] = goals;
  }

  return Object.keys(out).length ? out : undefined;
}

function normalizeFeatures(raw: unknown): DashboardFeatures | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const input = raw as DashboardFeatures;
  const features: DashboardFeatures = {};
  if (typeof input.campaignsEnabled === "boolean") {
    features.campaignsEnabled = input.campaignsEnabled;
  }
  return Object.keys(features).length ? features : undefined;
}

export function getGoalsForMonth(
  config: WidgetConfig,
  monthKey: string
): DashboardGoals | undefined {
  const monthly = config.goalsByMonth?.[monthKey];
  if (monthly && hasAnyGoal(monthly)) return monthly;
  if (config.goals && hasAnyGoal(config.goals)) return config.goals;
  return undefined;
}

export function campaignsEnabled(config: WidgetConfig): boolean {
  return config.features?.campaignsEnabled !== false;
}

export function defaultWidgetConfig(): WidgetConfig {
  return {
    widgets: WIDGET_DEFINITIONS.map((w, i) => ({
      id: w.id,
      enabled: true,
      order: i,
    })),
    goalsByMonth: {},
    features: { campaignsEnabled: true },
  };
}

export function normalizeWidgetConfig(raw: unknown): WidgetConfig {
  const defaults = defaultWidgetConfig();
  if (!raw || typeof raw !== "object") return defaults;

  const input = raw as {
    widgets?: unknown;
    goals?: unknown;
    goalsByMonth?: unknown;
    features?: unknown;
  };

  const goalsByMonth =
    normalizeGoalsByMonth(input.goalsByMonth) ||
    (() => {
      const legacy = normalizeGoals(input.goals);
      return legacy ? { [new Date().toISOString().slice(0, 7)]: legacy } : undefined;
    })();

  if (!Array.isArray(input.widgets)) {
    return {
      ...defaults,
      goalsByMonth: goalsByMonth || defaults.goalsByMonth,
      features: normalizeFeatures(input.features) || defaults.features,
    };
  }

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
    goalsByMonth: goalsByMonth || {},
    features: normalizeFeatures(input.features) || defaults.features,
  };
}

export function enabledWidgets(config: WidgetConfig): WidgetItem[] {
  return config.widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);
}

export function widgetLabel(id: WidgetId): string {
  return WIDGET_DEFINITIONS.find((w) => w.id === id)?.label || id;
}

export const WIDGET_CATEGORIES = [
  { id: "kpi" as const, label: "Indicadores (KPIs)" },
  { id: "chart" as const, label: "Gráficos" },
  { id: "table" as const, label: "Tablas" },
];
