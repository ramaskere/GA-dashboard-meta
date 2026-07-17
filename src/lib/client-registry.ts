import { getSupabaseAdmin } from "./supabase";
import { humanizeSupabaseError } from "./tokens";
import type { ClientConfig } from "./clients";
import goApple from "../../clients/go-apple.json";

/** Clientes incluidos en el código (siempre disponibles). */
export const BUILTIN_CLIENTS: Record<string, ClientConfig> = {
  "go-apple": goApple as ClientConfig,
};

export function isValidClientSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 2 && value.length <= 48;
}

export function slugifyClientName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

type ClientRow = {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  primary_color: string;
  accent_color: string;
  currency: string;
  locale: string;
  timezone: string;
  default_countries?: string[] | null;
};

function rowToConfig(row: ClientRow): ClientConfig {
  const countries = Array.isArray(row.default_countries)
    ? row.default_countries.filter((c) => typeof c === "string")
    : ["AR"];
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline || "Reportes de Meta Ads",
    logo: row.logo || "/clients/go-apple/logo.svg",
    primaryColor: row.primary_color || "#0071e3",
    accentColor: row.accent_color || "#1d1d1f",
    currency: row.currency || "ARS",
    locale: row.locale || "es-AR",
    timezone: row.timezone || "America/Argentina/Buenos_Aires",
    defaultCountries: countries.length ? countries : ["AR"],
  };
}

export async function listClientsFromDb(): Promise<ClientConfig[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("dashboard_clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    // Tabla inexistente, clave inválida, etc. → no tumbar el dashboard
    if (
      error.message?.includes("dashboard_clients") ||
      error.code === "42P01" ||
      /invalid api key|jwt|postcard/i.test(error.message || "")
    ) {
      console.warn("[clients]", humanizeSupabaseError(error.message));
      return [];
    }
    console.warn("[clients] listClientsFromDb:", error.message);
    return [];
  }

  return (data || []).map((row) => rowToConfig(row as ClientRow));
}

export async function getClientFromDb(id: string): Promise<ClientConfig | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("dashboard_clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (
      error.message?.includes("dashboard_clients") ||
      error.code === "42P01" ||
      /invalid api key|jwt|postcard/i.test(error.message || "")
    ) {
      return null;
    }
    console.warn("[clients] getClientFromDb:", error.message);
    return null;
  }

  return data ? rowToConfig(data as ClientRow) : null;
}

export async function listAllClients(): Promise<ClientConfig[]> {
  const fromDb = await listClientsFromDb();
  const map = new Map<string, ClientConfig>();

  for (const c of Object.values(BUILTIN_CLIENTS)) {
    map.set(c.id, c);
  }
  for (const c of fromDb) {
    map.set(c.id, c);
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function resolveClientConfig(clientId: string): Promise<ClientConfig> {
  if (BUILTIN_CLIENTS[clientId]) return BUILTIN_CLIENTS[clientId];

  const fromDb = await getClientFromDb(clientId);
  if (fromDb) return fromDb;

  if (BUILTIN_CLIENTS["go-apple"]) return BUILTIN_CLIENTS["go-apple"];

  throw new Error(`Cliente no encontrado: ${clientId}`);
}

export interface CreateClientInput {
  id: string;
  name: string;
  tagline?: string;
  logo?: string;
  primaryColor?: string;
  accentColor?: string;
  currency?: string;
  locale?: string;
  timezone?: string;
  defaultCountries?: string[];
}

export async function createClientInDb(input: CreateClientInput): Promise<ClientConfig> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      "Supabase no configurado. Agregá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const id = input.id.trim().toLowerCase();
  if (!isValidClientSlug(id)) {
    throw new Error(
      "ID inválido. Usá minúsculas, números y guiones (ej. mi-cliente)."
    );
  }

  const name = input.name.trim();
  if (!name) throw new Error("El nombre del cliente es obligatorio.");

  if (BUILTIN_CLIENTS[id]) {
    throw new Error(`El cliente "${id}" ya existe (incluido en el sistema).`);
  }

  const existing = await getClientFromDb(id);
  if (existing) {
    throw new Error(`Ya existe un cliente con el ID "${id}".`);
  }

  const row = {
    id,
    name,
    tagline: (input.tagline || "Reportes de Meta Ads").trim(),
    logo: (input.logo || "/clients/go-apple/logo.svg").trim(),
    primary_color: input.primaryColor || "#0071e3",
    accent_color: input.accentColor || "#1d1d1f",
    currency: (input.currency || "ARS").trim().toUpperCase(),
    locale: input.locale || "es-AR",
    timezone: input.timezone || "America/Argentina/Buenos_Aires",
    default_countries: input.defaultCountries?.length
      ? input.defaultCountries
      : ["AR"],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("dashboard_clients")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    if (error.message?.includes("dashboard_clients") || error.code === "42P01") {
      throw new Error(
        "Falta la tabla dashboard_clients. Ejecutá supabase/migration_clients.sql en el SQL Editor de Supabase."
      );
    }
    throw new Error(humanizeSupabaseError(error.message));
  }

  return rowToConfig(data as ClientRow);
}
