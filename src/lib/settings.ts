import { getClientId } from "./clients";
import { getSupabaseAdmin } from "./supabase";
import {
  defaultWidgetConfig,
  normalizeWidgetConfig,
  type WidgetConfig,
} from "./widgets";

export interface DashboardSettings {
  clientSlug: string;
  metaAccessToken: string;
  metaAdAccountId: string;
  dashboardPassword: string | null;
  widgetConfig: WidgetConfig;
  updatedAt: string | null;
  source: "supabase" | "env";
}

export interface DashboardSettingsPublic {
  configured: boolean;
  metaAdAccountId: string;
  metaAccessTokenSet: boolean;
  metaAccessTokenHint: string | null;
  dashboardPasswordSet: boolean;
  widgetConfig: WidgetConfig;
  updatedAt: string | null;
  source: "supabase" | "env" | "none";
  supabaseReady: boolean;
}

function normalizeAdAccountId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

function tokenHint(token: string): string | null {
  if (!token || token.length < 8) return null;
  return `…${token.slice(-6)}`;
}

function rowToSettings(row: {
  client_slug: string;
  meta_access_token: string;
  meta_ad_account_id: string;
  dashboard_password: string | null;
  widget_config?: unknown;
  updated_at: string | null;
}): DashboardSettings {
  return {
    clientSlug: row.client_slug,
    metaAccessToken: row.meta_access_token || "",
    metaAdAccountId: row.meta_ad_account_id || "",
    dashboardPassword: row.dashboard_password || null,
    widgetConfig: normalizeWidgetConfig(row.widget_config),
    updatedAt: row.updated_at || null,
    source: "supabase",
  };
}

export async function getSettings(
  clientSlug?: string
): Promise<DashboardSettings | null> {
  const slug = clientSlug || getClientId();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("dashboard_settings")
      .select("*")
      .eq("client_slug", slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (data) return rowToSettings(data);
  }

  const envToken = process.env.META_ACCESS_TOKEN?.trim() || "";
  const envAccount = process.env.META_AD_ACCOUNT_ID?.trim() || "";
  const envPassword = process.env.DASHBOARD_PASSWORD?.trim() || null;

  if (envToken || envAccount) {
    return {
      clientSlug: slug,
      metaAccessToken: envToken,
      metaAdAccountId: envAccount,
      dashboardPassword: envPassword,
      widgetConfig: defaultWidgetConfig(),
      updatedAt: null,
      source: "env",
    };
  }

  return null;
}

export async function getPublicSettings(
  clientSlug?: string
): Promise<DashboardSettingsPublic> {
  const settings = await getSettings(clientSlug);
  const supabaseReady = Boolean(getSupabaseAdmin());

  if (!settings) {
    return {
      configured: false,
      metaAdAccountId: "",
      metaAccessTokenSet: false,
      metaAccessTokenHint: null,
      dashboardPasswordSet: false,
      widgetConfig: defaultWidgetConfig(),
      updatedAt: null,
      source: "none",
      supabaseReady,
    };
  }

  const hasToken = Boolean(settings.metaAccessToken);
  const hasAccount = Boolean(settings.metaAdAccountId);

  return {
    configured: hasToken && hasAccount,
    metaAdAccountId: settings.metaAdAccountId,
    metaAccessTokenSet: hasToken,
    metaAccessTokenHint: tokenHint(settings.metaAccessToken),
    dashboardPasswordSet: Boolean(settings.dashboardPassword),
    widgetConfig: settings.widgetConfig,
    updatedAt: settings.updatedAt,
    source: settings.source,
    supabaseReady,
  };
}

export async function saveSettings(
  clientSlug: string,
  input: {
    metaAccessToken?: string;
    metaAdAccountId?: string;
    dashboardPassword?: string | null;
    widgetConfig?: WidgetConfig;
  }
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      "Supabase no configurado. Agregá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel."
    );
  }

  const existing = await getSettings(clientSlug);
  const keepToken = input.metaAccessToken === undefined;
  const token = keepToken
    ? existing?.metaAccessToken || ""
    : (input.metaAccessToken ?? "").trim();

  const accountId = normalizeAdAccountId(
    input.metaAdAccountId?.trim() || existing?.metaAdAccountId || ""
  );

  let dashboardPassword = existing?.dashboardPassword ?? null;
  if (input.dashboardPassword !== undefined) {
    const pwd = input.dashboardPassword?.trim();
    dashboardPassword = pwd || null;
  }

  const widgetConfig = input.widgetConfig
    ? normalizeWidgetConfig(input.widgetConfig)
    : existing?.widgetConfig || defaultWidgetConfig();

  const { error } = await supabase.from("dashboard_settings").upsert(
    {
      client_slug: clientSlug,
      meta_access_token: token,
      meta_ad_account_id: accountId,
      dashboard_password: dashboardPassword,
      widget_config: widgetConfig,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_slug" }
  );

  if (error) throw new Error(error.message);
}

export async function getMetaCredentials() {
  const settings = await getSettings();

  const token = settings?.metaAccessToken?.trim();
  const adAccountId = settings?.metaAdAccountId?.trim();

  if (!token) {
    throw new Error(
      "Falta el token de Meta. Configuralo en /settings o en META_ACCESS_TOKEN."
    );
  }
  if (!adAccountId) {
    throw new Error(
      "Falta el Ad Account ID. Configuralo en /settings o en META_AD_ACCOUNT_ID."
    );
  }

  return {
    token,
    adAccountId: normalizeAdAccountId(adAccountId),
  };
}

export async function getWidgetConfig(clientSlug?: string): Promise<WidgetConfig> {
  const settings = await getSettings(clientSlug);
  return settings?.widgetConfig || defaultWidgetConfig();
}

export async function saveWidgetConfig(
  clientSlug: string,
  widgetConfig: WidgetConfig
): Promise<void> {
  await saveSettings(clientSlug, { widgetConfig });
}

export async function getDashboardPassword(): Promise<string | null> {
  const settings = await getSettings();
  return settings?.dashboardPassword?.trim() || null;
}
