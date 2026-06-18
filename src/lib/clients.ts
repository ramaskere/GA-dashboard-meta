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
