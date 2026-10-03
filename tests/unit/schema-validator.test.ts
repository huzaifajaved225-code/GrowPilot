import { describe, it, expect } from "vitest";
import { validateSchema } from "@/ai-core/tools/schema-builder/schema-validator";

describe("Schema Validator", () => {
    it("validates a correct Organization schema", () => {
        const schema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Test Corp",
            url: "https://example.com",
            logo: "https://example.com/logo.png",
        };
        const result = validateSchema(schema);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("flags missing @context", () => {
        const schema = { "@type": "Organization", name: "Test" };
        const result = validateSchema(schema);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Missing @context property");
    });

    it("flags missing @type", () => {
        const schema = { "@context": "https://schema.org", name: "Test" };
        const result = validateSchema(schema);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Missing @type property");
    });

    it("warns on unrecognized schema type", () => {
        const schema = { "@context": "https://schema.org", "@type": "FakeType" };
        const result = validateSchema(schema);
        expect(result.valid).toBe(true);
        expect(result.warnings.some((w) => w.includes("Unrecognized"))).toBe(true);
    });

    it("flags empty name", () => {
        const schema = { "@context": "https://schema.org", "@type": "Organization", name: "" };
        const result = validateSchema(schema);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("empty"))).toBe(true);
    });

    it("flags invalid URL", () => {
        const schema = { "@context": "https://schema.org", "@type": "Organization", url: "not-a-url" };
        const result = validateSchema(schema);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("URL"))).toBe(true);
    });

    it("reports missing recommended properties", () => {
        const schema = { "@context": "https://schema.org", "@type": "Organization" };
        const result = validateSchema(schema);
        expect(result.valid).toBe(true);
        expect(result.missingRecommendedProperties).toContain("name");
        expect(result.missingRecommendedProperties).toContain("url");
    });

    it("rejects non-object input", () => {
        const result = validateSchema([] as unknown as Record<string, unknown>);
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain("JSON object");
    });

    it("does not hallucinate data", () => {
        const schema = { "@context": "https://schema.org", "@type": "Restaurant", name: "Test" };
        const result = validateSchema(schema);
        expect(result.valid).toBe(true);
        // Should not have rating or review unless explicitly added
        expect(schema).not.toHaveProperty("aggregateRating");
        expect(schema).not.toHaveProperty("review");
    });
});