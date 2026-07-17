import type { NextRequest } from "next/server";
import goApple from "../../clients/go-apple.json";
import { isValidClientSlug } from "./client-registry";

export interface ClientConfig {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  primaryColor: string;
  accentColor: string;
  currency: string;
  locale: string;
  timezone: string;
  defaultCountries?: string[];
}

/** Fallback síncrono (Go Apple). El listado completo viene de listAllClients(). */
const BUILTIN: Record<string, ClientConfig> = {
  "go-apple": goApple as ClientConfig,
};

export const CLIENT_COOKIE = "dashboard_client_id";

export function getClientId(): string {
  return process.env.CLIENT_ID || "go-apple";
}

/**
 * Resuelve el cliente activo desde cookie.
 * Acepta cualquier slug válido; la existencia se valida al cargar config.
 */
export function resolveClientId(
  cookieValue?: string | null,
  fallback?: string
): string {
  if (cookieValue && isValidClientSlug(cookieValue)) return cookieValue;
  const envId = fallback || getClientId();
  if (isValidClientSlug(envId)) return envId;
  return "go-apple";
}

export function resolveClientIdFromRequest(request: NextRequest): string {
  return resolveClientId(request.cookies.get(CLIENT_COOKIE)?.value);
}

/** Solo builtins — preferí resolveClientConfig() en páginas/API. */
export function getClientConfig(clientId?: string): ClientConfig {
  const id = clientId || getClientId();
  return BUILTIN[id] || BUILTIN["go-apple"];
}

export function listClients(): ClientConfig[] {
  return Object.values(BUILTIN);
}

export function hasMultipleClients(): boolean {
  return true;
}
