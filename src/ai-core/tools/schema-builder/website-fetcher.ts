/**
 * Native fetch + Cheerio website fetcher. Fetches public HTML pages
 * with SSRF protection, redirect validation, timeout, and size limits.
 */

import * as cheerio from "cheerio";
import { validateUrl, validateRedirectTarget } from "@/ai-core/tools/schema-builder/url-validator";
import type { WebsiteFetchResult } from "@/ai-core/tools/schema-builder/types";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_REDIRECTS = 5;
const USER_AGENT = "GrowPilot-SchemaBuilder/1.0 (+https://growpilot.app)";

export class WebsiteFetchError extends Error {
  public readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "WebsiteFetchError";
    this.code = code;
  }
}

/**
 * Fetches a public webpage with full SSRF protection.
 * Returns the final URL (after redirects), status code, content type,
 * and raw HTML. Only HTML responses are accepted.
 */
export async function fetchWebsite(url: string): Promise<WebsiteFetchResult> {
  const validation = validateUrl(url);
  if (!validation.valid || !validation.url) {
    throw new WebsiteFetchError(validation.error ?? "Invalid URL", "INVALID_URL");
  }

  const startTime = Date.now();
  let currentUrl = validation.url;
  let redirectCount = 0;

  while (redirectCount <= MAX_REDIRECTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "manual",
      });
      clearTimeout(timeoutId);

      // Handle redirects manually to re-validate each target
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          throw new WebsiteFetchError("Redirect without Location header", "BAD_REDIRECT");
        }
        const absoluteRedirect = new URL(location, currentUrl).href;
        const redirectValidation = validateRedirectTarget(absoluteRedirect);
        if (!redirectValidation.valid || !redirectValidation.url) {
          throw new WebsiteFetchError(
            "Redirect target is not allowed: " + (redirectValidation.error ?? "blocked"),
            "SSRF_REDIRECT",
          );
        }
        currentUrl = redirectValidation.url;
        redirectCount++;
        continue;
      }

      if (!response.ok) {
        const statusText = response.statusText || String(response.status);
        throw new WebsiteFetchError(
          "Website returned HTTP " + response.status + " " + statusText,
          "HTTP_ERROR",
        );
      }

      const contentType = response.headers.get("content-type") ?? "unknown";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        throw new WebsiteFetchError(
          "Expected HTML page but received: " + contentType,
          "NON_HTML_CONTENT",
        );
      }

      // Read body with size limit
      const reader = response.body?.getReader();
      if (!reader) {
        throw new WebsiteFetchError("No response body", "EMPTY_RESPONSE");
      }

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_RESPONSE_BYTES) {
          reader.cancel().catch(() => {});
          throw new WebsiteFetchError("Response exceeds maximum allowed size", "TOO_LARGE");
        }
        chunks.push(value);
      }

      const decoder = new TextDecoder("utf-8", { fatal: false });
      let html = "";
      for (const chunk of chunks) {
        html += decoder.decode(chunk);
      }

      const responseTimeMs = Date.now() - startTime;

      return {
        finalUrl: currentUrl,
        statusCode: response.status,
        contentType,
        html,
        responseTimeMs,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof WebsiteFetchError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new WebsiteFetchError("Request timed out", "TIMEOUT");
      }
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new WebsiteFetchError("Could not connect to the website", "NETWORK_ERROR");
      }
      throw new WebsiteFetchError(
        error instanceof Error ? error.message : "Unknown fetch error",
        "FETCH_ERROR",
      );
    }
  }

  throw new WebsiteFetchError("Too many redirects", "TOO_MANY_REDIRECTS");
}

/**
 * Parses raw HTML into a Cheerio root element for further extraction.
 */
export function parseHtml(html: string): cheerio.CheerioAPI {
  return cheerio.load(html);
}
