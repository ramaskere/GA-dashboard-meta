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
}

import goApple from "../../clients/go-apple.json";

const CLIENTS: Record<string, ClientConfig> = {
  "go-apple": goApple as ClientConfig,
};

export function getClientId(): string {
  return process.env.CLIENT_ID || "go-apple";
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

export function getMetaCredentials() {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!token) {
    throw new Error("Falta META_ACCESS_TOKEN en variables de entorno");
  }
  if (!adAccountId) {
    throw new Error("Falta META_AD_ACCOUNT_ID en variables de entorno");
  }

  const accountId = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;

  return { token, adAccountId: accountId };
}

export function getDashboardPassword(): string | null {
  const pwd = process.env.DASHBOARD_PASSWORD?.trim();
  return pwd || null;
}
