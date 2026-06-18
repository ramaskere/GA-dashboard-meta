import { getClientConfig } from "@/lib/clients";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  const client = getClientConfig();

  return <Dashboard client={client} />;
}
