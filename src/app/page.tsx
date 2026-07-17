import { cookies } from "next/headers";
import { resolveClientId, CLIENT_COOKIE } from "@/lib/clients";
import { listAllClients, resolveClientConfig } from "@/lib/client-registry";
import { Dashboard } from "@/components/Dashboard";

export default async function Home() {
  const cookieStore = await cookies();
  const clientId = resolveClientId(cookieStore.get(CLIENT_COOKIE)?.value);
  const [client, availableClients] = await Promise.all([
    resolveClientConfig(clientId),
    listAllClients(),
  ]);

  return <Dashboard client={client} availableClients={availableClients} />;
}
