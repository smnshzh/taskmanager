import { PMOProviders } from "@/components/pmo/providers";
import { DashboardShell } from "@/components/pmo/dashboard-shell";

export default function Home() {
  return (
    <PMOProviders>
      <DashboardShell />
    </PMOProviders>
  );
}
