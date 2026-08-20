export const siteConfig = {
  name: "GrowPilot",
  shortName: "GrowPilot",
  description:
    "AI-powered business growth platform for SEO, GEO, AEO, content, analytics, Google Business Profile, and social media management.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ogImage: "/og/default.png",
  links: {
    twitter: "https://twitter.com/growpilot",
    github: "https://github.com/growpilot",
  },
  legal: {
    supportEmail: "support@growpilot.app",
  },
} as const;

export type SiteConfig = typeof siteConfig;
