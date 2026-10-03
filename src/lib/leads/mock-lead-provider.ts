import type {
  DiscoveredLeadCandidate,
  ILeadDataProvider,
  LeadDiscoveryCriteria,
} from "@/lib/leads/lead-provider.interface";

/**
 * Clean URL slug generator.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * MockLeadDataProvider — returns realistic candidate businesses for development,
 * local testing, and staging environments without scraping or violating terms.
 *
 * Clearly tags each lead with source: "mock-development-provider".
 */
export class MockLeadDataProvider implements ILeadDataProvider {
  public readonly providerId = "mock-development-provider";

  public async discoverLeads(criteria: LeadDiscoveryCriteria): Promise<DiscoveredLeadCandidate[]> {
    const { industry, location, targetCustomer, count = 10 } = criteria;
    const requestedCount = Math.min(Math.max(count, 1), 30);

    const businessPrefixes = [
      "Apex",
      "Vanguard",
      "Horizon",
      "Nexus",
      "Prime",
      "Elevate",
      "Velocity",
      "Summit",
      "Crestview",
      "Synergy",
      "Beacon",
      "Quantum",
      "Evergreen",
      "Catalyst",
      "Optima",
      "Pulse",
      "Sterling",
      "Alpha",
      "BlueSky",
      "NextGen",
      "Acuity",
      "Dynamic",
      "Zenith",
      "Strata",
      "Frontier",
      "Pinnacle",
      "Atlas",
      "Silverline",
      "BrightPath",
      "Meridian",
    ];

    const businessSuffixes = [
      "Solutions",
      "Group",
      "Partners",
      "Associates",
      "Hub",
      "Enterprises",
      "Labs",
      "Studio",
      "Collective",
      "Works",
    ];

    const painPoints = [
      "Established local reputation with outdated website, missing schema markup, and minimal organic search traffic.",
      "Rapidly growing business with low Google Business Profile review volume and inactive social channels.",
      "High-value service provider lacking generative AI search visibility (GEO/Perplexity/Gemini answers).",
      "Regional brand with solid referral base but zero structured SEO optimization or content marketing pipeline.",
      "Modern brand identity but sluggish mobile site performance and unoptimized landing pages.",
      "Active social presence with no automated lead capture funnel or local search engine citations.",
    ];

    const leads: DiscoveredLeadCandidate[] = [];

    for (let i = 0; i < requestedCount; i++) {
      const prefix = businessPrefixes[i % businessPrefixes.length] ?? "Apex";
      const suffix = businessSuffixes[i % businessSuffixes.length] ?? "Solutions";
      const businessName = `${prefix} ${industry.trim()} ${suffix}`;
      const domain = `${slugify(prefix)}-${slugify(industry.slice(0, 15))}.com`;
      const description =
        painPoints[i % painPoints.length] ?? "Needs growth and search optimization.";

      leads.push({
        businessName,
        industry: industry.trim(),
        location: location.trim(),
        targetCustomer: targetCustomer?.trim() || "Small to medium businesses",
        website: `https://www.${domain}`,
        description,
        source: this.providerId,
      });
    }

    return leads;
  }
}
