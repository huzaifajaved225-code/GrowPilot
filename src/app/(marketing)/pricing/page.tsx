import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
};

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals exploring AI-powered growth tools.",
    features: ["1 project", "Basic SEO audit", "Limited AI queries", "Community support"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    description: "For businesses ready to accelerate growth.",
    features: [
      "5 projects",
      "Full SEO & GEO audits",
      "AI content generation",
      "Answer engine optimization",
      "Analytics dashboard",
      "Priority support",
    ],
    highlighted: true,
    badge: "Popular",
  },
  {
    name: "Agency",
    price: "$99",
    description: "For agencies managing multiple client brands.",
    features: [
      "Unlimited projects",
      "All Pro features",
      "Google Business Profile AI",
      "Social media automation",
      "Team collaboration",
      "White-label reports",
      "Dedicated support",
    ],
    highlighted: false,
  },
];

export default function PricingPage(): React.JSX.Element {
  return (
    <section className="container flex flex-col items-center gap-12 py-24">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Choose the plan that fits your business. Upgrade or downgrade at any time.
        </p>
      </div>

      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlighted
                ? "relative flex flex-col border-primary/50 p-6"
                : "relative flex flex-col p-6"
            }
          >
            {plan.badge ? <Badge className="absolute -top-3 right-6">{plan.badge}</Badge> : null}
            <div className="mb-4">
              <h2 className="font-heading text-xl font-semibold">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <ul className="mb-8 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant={plan.highlighted ? "default" : "outline"} className="w-full" asChild>
              <Link href="/login">Get started</Link>
            </Button>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        All plans include access to the {siteConfig.name} AI growth dashboard. Contact us for
        enterprise pricing.
      </p>
    </section>
  );
}
