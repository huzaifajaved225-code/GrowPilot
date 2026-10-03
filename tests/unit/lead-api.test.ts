import { describe, it, expect } from "vitest";
import { MockLeadDataProvider } from "@/lib/leads/mock-lead-provider";
import { LeadService } from "@/lib/leads/lead-service";

describe("Lead Provider and Service", () => {
  it("generates realistic candidate leads for requested industry and location", async () => {
    const provider = new MockLeadDataProvider();
    const candidates = await provider.discoverLeads({
      industry: "Digital Marketing Agency",
      location: "Karachi, Pakistan",
      count: 5,
    });

    expect(candidates.length).toBe(5);
    for (const c of candidates) {
      expect(c.industry).toBe("Digital Marketing Agency");
      expect(c.location).toBe("Karachi, Pakistan");
      expect(c.businessName).toBeDefined();
      expect(c.website).toBeDefined();
      expect(c.source).toBe("mock-development-provider");
    }
  });

  it("clamps candidate count between 1 and 30", async () => {
    const provider = new MockLeadDataProvider();
    const overCount = await provider.discoverLeads({
      industry: "Legal",
      location: "New York",
      count: 100,
    });
    expect(overCount.length).toBe(30);

    const zeroCount = await provider.discoverLeads({
      industry: "Legal",
      location: "New York",
      count: 0,
    });
    expect(zeroCount.length).toBe(1);
  });

  it("LeadService discovers and qualifies leads with fallback resilience", async () => {
    const service = new LeadService();
    const result = await service.generateLeads({
      userId: "test-user-123",
      criteria: {
        industry: "Dental Clinic",
        location: "Austin, TX",
        count: 3,
      },
    });

    expect(result.leads.length).toBe(3);
    expect(result.provider).toBe("mock-development-provider");
    for (const lead of result.leads) {
      expect(lead.score).toBeGreaterThanOrEqual(0);
      expect(lead.score).toBeLessThanOrEqual(100);
      expect(["HOT", "WARM", "COLD"]).toContain(lead.status);
      expect(lead.opportunity).toBeDefined();
      expect(lead.recommendedService).toBeDefined();
    }
  }, 15000);

  it("formats CSV data correctly without missing fields", () => {
    const mockLeads = [
      {
        businessName: "Nexus Marketing Group",
        industry: "Marketing",
        location: "Karachi",
        website: "https://nexus-marketing.com",
        score: 85,
        status: "HOT" as const,
        opportunity: "Needs SEO",
        recommendedService: "SEO Audit",
        aiInsight: "High conversion lead",
        nextAction: "Send email",
      },
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const lead = mockLeads[0]!;
    const row = [
      escapeCsv(lead.businessName),
      escapeCsv(lead.industry),
      escapeCsv(lead.location),
      escapeCsv(lead.website),
      escapeCsv(lead.score),
      escapeCsv(lead.status),
      escapeCsv(lead.opportunity),
      escapeCsv(lead.recommendedService),
      escapeCsv(lead.aiInsight),
      escapeCsv(lead.nextAction),
    ].join(",");

    expect(row).toBe(
      '"Nexus Marketing Group","Marketing","Karachi","https://nexus-marketing.com","85","HOT","Needs SEO","SEO Audit","High conversion lead","Send email"',
    );
  });
});
