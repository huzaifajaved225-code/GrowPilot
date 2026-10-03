/**
 * Shared types for the Schema Builder module.
 */

export const SCHEMA_TYPES = [
  "Organization",
  "LocalBusiness",
  "Restaurant",
  "Store",
  "Service",
  "Product",
  "SoftwareApplication",
  "Article",
  "Person",
  "WebSite",
  "WebPage",
] as const;

export type SchemaType = (typeof SCHEMA_TYPES)[number];

export const BUSINESS_TYPE_OPTIONS: { label: string; value: SchemaType | "auto" }[] = [
  { label: "Auto Detect", value: "auto" },
  { label: "Organization", value: "Organization" },
  { label: "Local Business", value: "LocalBusiness" },
  { label: "Restaurant", value: "Restaurant" },
  { label: "Store", value: "Store" },
  { label: "Service", value: "Service" },
  { label: "Product / E-commerce", value: "Product" },
  { label: "Software / SaaS", value: "SoftwareApplication" },
  { label: "Article / Blog", value: "Article" },
  { label: "Person", value: "Person" },
];

export interface WebsiteFetchResult {
  readonly finalUrl: string;
  readonly statusCode: number;
  readonly contentType: string;
  readonly html: string;
  readonly responseTimeMs: number;
}

export interface ExtractedMetadata {
  readonly title: string | null;
  readonly description: string | null;
  readonly canonical: string | null;
  readonly language: string | null;
  readonly robots: string | null;
  readonly viewport: string | null;
  readonly headings: {
    readonly h1: readonly string[];
    readonly h2: readonly string[];
    readonly h3: readonly string[];
  };
  readonly openGraph: {
    readonly ogTitle: string | null;
    readonly ogDescription: string | null;
    readonly ogImage: string | null;
    readonly ogUrl: string | null;
    readonly ogType: string | null;
  };
  readonly twitter: {
    readonly twitterCard: string | null;
    readonly twitterTitle: string | null;
    readonly twitterDescription: string | null;
    readonly twitterImage: string | null;
  };
  readonly contact: {
    readonly businessName: string | null;
    readonly phone: string | null;
    readonly email: string | null;
    readonly address: string | null;
    readonly postalCode: string | null;
    readonly country: string | null;
    readonly city: string | null;
    readonly logo: string | null;
    readonly image: string | null;
    readonly openingHours: readonly string[];
    readonly priceInfo: readonly string[];
    readonly serviceDescriptions: readonly string[];
  };
  readonly socialProfiles: readonly string[];
  readonly textContent: string;
}

export interface ExistingStructuredData {
  readonly type: "json-ld" | "microdata" | "rdfa";
  readonly raw: string;
  readonly schemaType: string | null;
  readonly context: string | null;
  readonly valid: boolean;
  readonly parseError: string | null;
}

export interface BusinessTypeDetection {
  readonly type: SchemaType;
  readonly confidence: number;
  readonly signals: readonly string[];
  readonly method: "deterministic" | "ai";
}

export interface SchemaValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly missingRecommendedProperties: readonly string[];
}

export interface ReadabilityCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface ReadabilityResult {
  readonly score: number;
  readonly checks: readonly ReadabilityCheck[];
}

export interface SchemaGenerateResponse {
  readonly url: string;
  readonly businessType: BusinessTypeDetection;
  readonly website: {
    readonly title: string | null;
    readonly description: string | null;
    readonly canonical: string | null;
    readonly headings: ExtractedMetadata["headings"];
    readonly contact: ExtractedMetadata["contact"];
    readonly socialProfiles: readonly string[];
  };
  readonly existingSchema: readonly ExistingStructuredData[];
  readonly generatedSchema: Record<string, unknown>;
  readonly validation: SchemaValidationResult;
  readonly readability: ReadabilityResult;
  readonly missingInformation: readonly string[];
}
