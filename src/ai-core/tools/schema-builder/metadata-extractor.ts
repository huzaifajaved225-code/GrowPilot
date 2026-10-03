/**
 * Metadata and business-signal extractor using Cheerio.
 * Extracts basic metadata, headings, Open Graph, Twitter, contact info,
 * social profiles, and text content from a parsed HTML page.
 */

import type { CheerioAPI } from "cheerio";
import type { ExtractedMetadata } from "@/ai-core/tools/schema-builder/types";

/**
 * Extracts comprehensive metadata from a Cheerio-parsed HTML page.
 */
export function extractMetadata($: CheerioAPI, baseUrl: string): ExtractedMetadata {
  const title = $("title").first().text().trim() || null;
  const description = getMetaContent($, "description");
  const canonical = $('link[rel="canonical"]').attr("href") || null;
  const language = $("html").attr("lang") || null;
  const robots = getMetaContent($, "robots");
  const viewport = getMetaContent($, "viewport");

  const headings = extractHeadings($);
  const openGraph = extractOpenGraph($);
  const twitter = extractTwitter($);
  const contact = extractContactSignals($, baseUrl);
  const socialProfiles = extractSocialProfiles($);
  const textContent = extractTextContent($);

  return {
    title,
    description,
    canonical,
    language,
    robots,
    viewport,
    headings,
    openGraph,
    twitter,
    contact,
    socialProfiles,
    textContent,
  };
}

function getMetaContent($: CheerioAPI, name: string): string | null {
  const content =
    $('meta[property="og:' + name + '"]').attr("content") ||
    $('meta[name="' + name + '"]').attr("content");
  return content?.trim() || null;
}

function extractHeadings($: CheerioAPI): ExtractedMetadata["headings"] {
  const h1: string[] = [];
  const h2: string[] = [];
  const h3: string[] = [];

  $("h1").each((_i, el) => {
    const text = $(el).text().trim();
    if (text) h1.push(text);
  });
  $("h2").each((_i, el) => {
    const text = $(el).text().trim();
    if (text) h2.push(text);
  });
  $("h3").each((_i, el) => {
    const text = $(el).text().trim();
    if (text) h3.push(text);
  });

  return { h1, h2, h3 };
}

function extractOpenGraph($: CheerioAPI): ExtractedMetadata["openGraph"] {
  return {
    ogTitle: $('meta[property="og:title"]').attr("content")?.trim() || null,
    ogDescription: $('meta[property="og:description"]').attr("content")?.trim() || null,
    ogImage: $('meta[property="og:image"]').attr("content")?.trim() || null,
    ogUrl: $('meta[property="og:url"]').attr("content")?.trim() || null,
    ogType: $('meta[property="og:type"]').attr("content")?.trim() || null,
  };
}

function extractTwitter($: CheerioAPI): ExtractedMetadata["twitter"] {
  return {
    twitterCard: $('meta[name="twitter:card"]').attr("content")?.trim() || null,
    twitterTitle: $('meta[name="twitter:title"]').attr("content")?.trim() || null,
    twitterDescription: $('meta[name="twitter:description"]').attr("content")?.trim() || null,
    twitterImage: $('meta[name="twitter:image"]').attr("content")?.trim() || null,
  };
}

function extractContactSignals($: CheerioAPI, baseUrl: string): ExtractedMetadata["contact"] {
  // Business name: try og:site_name, then JSON-LD, then first heading
  const businessName =
    $('meta[property="og:site_name"]').attr("content")?.trim() ||
    $("h1").first().text().trim() ||
    null;

  // Phone: tel: links or text patterns
  const phones: string[] = [];
  $('a[href^="tel:"]').each((_i, el) => {
    const href = $(el).attr("href");
    if (href) phones.push(href.replace("tel:", "").trim());
  });
  const phonePattern = /[\+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}/g;
  const bodyText = $("body").text();
  const phoneMatches = bodyText.match(phonePattern);
  if (phoneMatches) {
    for (const p of phoneMatches.slice(0, 3)) {
      if (!phones.includes(p.trim())) phones.push(p.trim());
    }
  }

  // Email: mailto: links or text patterns
  const emails: string[] = [];
  $('a[href^="mailto:"]').each((_i, el) => {
    const href = $(el).attr("href");
    if (href) emails.push(href.replace("mailto:", "").trim());
  });
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = bodyText.match(emailPattern);
  if (emailMatches) {
    for (const e of emailMatches.slice(0, 3)) {
      if (!emails.includes(e)) emails.push(e);
    }
  }

  // Address: look for schema.org address or address patterns
  const addressEl = $('[itemprop="address"]');
  const address = addressEl.length > 0 ? addressEl.text().trim() : null;

  // Postal code
  const postalCode =
    $('[itemprop="postalCode"]').text().trim() ||
    (bodyText.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/g) || [])[0] ||
    null;

  // Logo and image
  const logo =
    $('link[rel="logo"]').attr("href") || $('meta[property="og:image"]').attr("content") || null;
  const image = $('meta[property="og:image"]').attr("content") || null;

  // Opening hours
  const openingHours: string[] = [];
  $('[itemprop="openingHours"]').each((_i, el) => {
    const content = $(el).attr("content") || $(el).text();
    if (content.trim()) openingHours.push(content.trim());
  });

  // Price info
  const priceInfo: string[] = [];
  $('[itemprop="price"]').each((_i, el) => {
    const content = $(el).attr("content") || $(el).text();
    if (content.trim()) priceInfo.push(content.trim());
  });
  $('[itemprop="priceRange"]').each((_i, el) => {
    const content = $(el).attr("content") || $(el).text();
    if (content.trim()) priceInfo.push(content.trim());
  });

  // Service descriptions
  const serviceDescriptions: string[] = [];
  $('[itemprop="serviceType"]').each((_i, el) => {
    const text = $(el).text().trim();
    if (text) serviceDescriptions.push(text);
  });
  $('[itemprop="description"]').each((_i, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 500) serviceDescriptions.push(text);
  });

  // Try to detect city/country from structured data or text
  const city = $('[itemprop="addressLocality"]').text().trim() || null;
  const country = $('[itemprop="addressCountry"]').text().trim() || null;

  return {
    businessName: businessName && businessName.length < 200 ? businessName : null,
    phone: phones[0] ?? null,
    email: emails[0] ?? null,
    address,
    postalCode,
    country,
    city,
    logo: logo ? resolveUrl(logo, baseUrl) : null,
    image: image ? resolveUrl(image, baseUrl) : null,
    openingHours,
    priceInfo,
    serviceDescriptions: serviceDescriptions.slice(0, 10),
  };
}

function extractSocialProfiles($: CheerioAPI): string[] {
  const socialDomains = [
    "twitter.com",
    "x.com",
    "facebook.com",
    "fb.com",
    "linkedin.com",
    "instagram.com",
    "youtube.com",
    "github.com",
    "tiktok.com",
    "pinterest.com",
  ];
  const profiles: string[] = [];

  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href")?.toLowerCase() ?? "";
    for (const domain of socialDomains) {
      if (href.includes(domain) && !profiles.includes(href)) {
        try {
          const resolved = new URL(href).href;
          profiles.push(resolved);
        } catch {
          // skip invalid URLs
        }
        break;
      }
    }
  });

  return profiles.slice(0, 20);
}

function extractTextContent($: CheerioAPI): string {
  // Remove script/style/nav/footer for cleaner text
  const clone = $.root().clone();
  clone.find("script, style, nav, footer, noscript").remove();
  const text = clone.text().replace(/\s+/g, " ").trim();
  // Limit to first 4000 chars for AI context
  return text.slice(0, 4000);
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}
