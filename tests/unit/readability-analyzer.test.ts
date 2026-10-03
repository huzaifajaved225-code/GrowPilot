import { describe, it, expect } from "vitest";
import { analyzeReadability } from "@/ai-core/tools/schema-builder/readability-analyzer";
import type { ExtractedMetadata, ExistingStructuredData } from "@/ai-core/tools/schema-builder/types";

function makeMetadata(overrides?: Partial<ExtractedMetadata>): ExtractedMetadata {
    return {
        title: "Test Page",
        description: "A test page with enough content to be meaningful for search engines",
        canonical: "https://example.com",
        language: "en",
        robots: null,
        viewport: "width=device-width",
        headings: { h1: ["Welcome"], h2: ["About"], h3: [] },
        openGraph: { ogTitle: "Test", ogDescription: "Test desc", ogImage: null, ogUrl: null, ogType: null },
        twitter: { twitterCard: null, twitterTitle: null, twitterDescription: null, twitterImage: null },
        contact: {
            businessName: "Test Co", phone: "+1234567890", email: "info@test.com",
            address: "123 Main St", postalCode: "12345", country: "US", city: "Testville",
            logo: null, image: null, openingHours: [], priceInfo: [], serviceDescriptions: [],
        },
        socialProfiles: ["https://twitter.com/test"],
        textContent: "This is a test page with meaningful content.".repeat(20),
        ...overrides,
    };
}

describe("Readability Analyzer", () => {
    it("gives high score for well-optimized page", () => {
        const meta = makeMetadata();
        const existing: ExistingStructuredData[] = [{
            type: "json-ld", raw: "{}", schemaType: "Organization",
            context: "https://schema.org", valid: true, parseError: null,
        }];
        const result = analyzeReadability(meta, existing);
        expect(result.score).toBeGreaterThanOrEqual(70);
        expect(result.checks.length).toBeGreaterThan(0);
    });

    it("gives low score for page missing everything", () => {
        const meta = makeMetadata({
            title: null, description: null, canonical: null, language: null,
            headings: { h1: [], h2: [], h3: [] },
            openGraph: { ogTitle: null, ogDescription: null, ogImage: null, ogUrl: null, ogType: null },
            contact: {
                businessName: null, phone: null, email: null,
                address: null, postalCode: null, country: null, city: null,
                logo: null, image: null, openingHours: [], priceInfo: [], serviceDescriptions: [],
            },
            socialProfiles: [],
            textContent: "",
        });
        const result = analyzeReadability(meta, []);
        expect(result.score).toBeLessThanOrEqual(30);
    });

    it("flags noindex pages", () => {
        const meta = makeMetadata({ robots: "noindex, nofollow" });
        const result = analyzeReadability(meta, []);
        const indexCheck = result.checks.find((c) => c.id === "robots");
        expect(indexCheck?.passed).toBe(false);
    });

    it("flags missing structured data", () => {
        const meta = makeMetadata();
        const result = analyzeReadability(meta, []);
        const sdCheck = result.checks.find((c) => c.id === "structured-data");
        expect(sdCheck?.passed).toBe(false);
    });

    it("passes when structured data exists", () => {
        const meta = makeMetadata();
        const existing: ExistingStructuredData[] = [{
            type: "json-ld", raw: "{}", schemaType: "Organization",
            context: "https://schema.org", valid: true, parseError: null,
        }];
        const result = analyzeReadability(meta, existing);
        const sdCheck = result.checks.find((c) => c.id === "structured-data");
        expect(sdCheck?.passed).toBe(true);
    });
});