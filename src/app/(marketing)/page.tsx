import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage(): React.JSX.Element {
  return (
    <section className="container flex flex-col items-center gap-6 py-24 text-center">
      <Badge variant="secondary">Foundation build — Phase 2</Badge>
      <h1 className="max-w-2xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        {siteConfig.name}
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">{siteConfig.description}</p>
      <p className="text-xs text-muted-foreground/70">
        Marketing, authentication, and dashboard features ship in the phases that follow this
        project setup.
      </p>
    </section>
  );
}
