import { getClientConfig } from "@/lib/clients";
import { CampaignsPage } from "@/components/CampaignsPage";

export default function Campaigns() {
  const client = getClientConfig();
  return <CampaignsPage client={client} />;
}
