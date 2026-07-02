import { cookies } from "next/headers";
import {
  getClientConfig,
  listClients,
  resolveClientId,
  CLIENT_COOKIE,
} from "@/lib/clients";
import { Dashboard } from "@/components/Dashboard";

export default async function Home() {
  const cookieStore = await cookies();
  const clientId = resolveClientId(cookieStore.get(CLIENT_COOKIE)?.value);
  const client = getClientConfig(clientId);

  return (
    <Dashboard client={client} availableClients={listClients()} />
  );
}
