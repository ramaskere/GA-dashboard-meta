import type { NextRequest } from "next/server";
import goApple from "../../clients/go-apple.json";
import ejemplo from "../../clients/ejemplo.json";

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

const CLIENTS: Record<string, ClientConfig> = {
  "go-apple": goApple as ClientConfig,
  ejemplo: ejemplo as ClientConfig,
};

export const CLIENT_COOKIE = "dashboard_client_id";

export function getClientId(): string {
  return process.env.CLIENT_ID || "go-apple";
}

export function resolveClientId(
  cookieValue?: string | null,
  fallback?: string
): string {
  if (cookieValue && CLIENTS[cookieValue]) return cookieValue;
  const envId = fallback || getClientId();
  if (CLIENTS[envId]) return envId;
  return "go-apple";
}

export function resolveClientIdFromRequest(request: NextRequest): string {
  return resolveClientId(request.cookies.get(CLIENT_COOKIE)?.value);
}

export function getClientConfig(clientId?: string): ClientConfig {
  const id = clientId || getClientId();
  const config = CLIENTS[id];
  if (!config) {
    throw new Error(`Cliente no configurado: ${id}. Agregá clients/${id}.json`);
  }
  return config;
}

export function listClients(): ClientConfig[] {
  return Object.values(CLIENTS);
}

export function hasMultipleClients(): boolean {
  return Object.keys(CLIENTS).length > 1;
}
