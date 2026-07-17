import { cookies } from "next/headers";
import { resolveClientId, CLIENT_COOKIE } from "@/lib/clients";
import { listAllClients, resolveClientConfig } from "@/lib/client-registry";
import { SettingsPage } from "@/components/SettingsPage";

export default async function Settings() {
  const cookieStore = await cookies();
  const clientId = resolveClientId(cookieStore.get(CLIENT_COOKIE)?.value);
  const [client, availableClients] = await Promise.all([
    resolveClientConfig(clientId),
    listAllClients(),
  ]);

  return <SettingsPage client={client} availableClients={availableClients} />;
}
