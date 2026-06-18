import { getClientConfig } from "@/lib/clients";
import { SettingsPage } from "@/components/SettingsPage";

export default function Settings() {
  const client = getClientConfig();
  return <SettingsPage client={client} />;
}
