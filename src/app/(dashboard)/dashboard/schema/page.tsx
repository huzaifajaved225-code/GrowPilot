import { auth } from "@/lib/auth/auth";
import { SchemaBuilderPanel } from "@/components/schema/schema-builder-panel";
import { Code } from "lucide-react";

/**
 * Schema Builder page — rendered inside the dashboard layout.
 */
export default async function SchemaBuilderPage(): Promise<React.JSX.Element> {
  const session = await auth();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Code className="h-4 w-4" />
          Schema Builder
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Schema &amp; Search Readability Builder
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Analyze your website and generate copy-ready JSON-LD structured data
          to improve search engine readability.
        </p>
      </div>

      <SchemaBuilderPanel isAuthenticated={!!session?.user?.id} />
    </div>
  );
}
