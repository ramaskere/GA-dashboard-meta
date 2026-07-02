import { cookies } from "next/headers";
import {
  getClientConfig,
  listClients,
  resolveClientId,
  CLIENT_COOKIE,
} from "@/lib/clients";
import { SettingsPage } from "@/components/SettingsPage";

export default async function Settings() {
  const cookieStore = await cookies();
  const clientId = resolveClientId(cookieStore.get(CLIENT_COOKIE)?.value);
  const client = getClientConfig(clientId);

  return (
    <SettingsPage client={client} availableClients={listClients()} />
  );
}
