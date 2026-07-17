import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveClientId, CLIENT_COOKIE } from "@/lib/clients";
import { listAllClients, resolveClientConfig } from "@/lib/client-registry";
import { getPublicSettings } from "@/lib/settings";
import { campaignsEnabled } from "@/lib/widgets";
import { CampaignsPage } from "@/components/CampaignsPage";

export default async function Campaigns() {
  const cookieStore = await cookies();
  const clientId = resolveClientId(cookieStore.get(CLIENT_COOKIE)?.value);
  const settings = await getPublicSettings(clientId);

  if (!campaignsEnabled(settings.widgetConfig)) {
    redirect("/");
  }

  const [client, availableClients] = await Promise.all([
    resolveClientConfig(clientId),
    listAllClients(),
  ]);

  return <CampaignsPage client={client} availableClients={availableClients} />;
}
