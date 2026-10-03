import { auth } from "@/lib/auth/auth";
import { UserCheck } from "lucide-react";
import { LeadGenerationPanel } from "@/components/leads/lead-generation-panel";

export const metadata = {
  title: "AI Lead Generation | GrowPilot",
  description: "Find, qualify and prioritize high-potential business leads with AI.",
};

/**
 * Lead Generation Page — server component inside dashboard layout.
 */
export default async function LeadsPage(): Promise<React.JSX.Element> {
  const session = await auth();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <UserCheck className="h-4 w-4 text-primary" />
          <span>Marketing &amp; Growth / Lead Generation</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI Lead Generation</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Find, qualify and prioritize high-potential business leads with AI.
        </p>
      </div>

      {/* Main Panel */}
      <LeadGenerationPanel userEmail={session?.user?.email} />
    </div>
  );
}
