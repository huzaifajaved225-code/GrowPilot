/**
 * SSRF-safe URL validator. Blocks private IPs, localhost, cloud metadata
 * endpoints, and non-HTTP(S) protocols before any network request.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "0:0:0:0:0:0:0:1",
  "metadata.google.internal",
  "169.254.169.254",
  "metadata.internal",
]);

export interface UrlValidationResult {
  readonly valid: boolean;
  readonly url: string | null;
  readonly error: string | null;
}

/**
 * Checks whether an IPv4 address (dotted-quad string) falls within a private/reserved range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return false;
  const [a, b] = parts;

  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (link-local, includes cloud metadata IP)
  if (a === 169 && b === 254) return true;
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 0.0.0.0/8
  if (a === 0) return true;

  return false;
}

/**
 * Checks whether a string looks like a private/reserved IPv6 address.
 */
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
  if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
  if (lower.startsWith("fe80:")) return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  return false;
}

/**
 * Validates and normalizes a URL with full SSRF protection.
 * Only allows http:// and https:// protocols to public addresses.
 */
export function validateUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, url: null, error: "URL is required" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, url: null, error: "Invalid URL format" };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return { valid: false, url: null, error: "Only HTTP and HTTPS protocols are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, url: null, error: "Access to this address is not allowed" };
  }

  // Check IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { valid: false, url: null, error: "Access to private network addresses is not allowed" };
    }
  }

  // Check IPv6 (may be in brackets)
  if (hostname.startsWith("[") || hostname.includes(":")) {
    const ipv6 = hostname.replace(/^\[|\]$/g, "");
    if (isPrivateIPv6(ipv6)) {
      return { valid: false, url: null, error: "Access to this address is not allowed" };
    }
  }

  // Block internal domains
  if (hostname.endsWith(".internal") || hostname.endsWith(".local")) {
    return { valid: false, url: null, error: "Access to internal domains is not allowed" };
  }

  return { valid: true, url: parsed.href, error: null };
}

/**
 * Re-validates a URL after redirects to ensure the destination is also safe.
 */
export function validateRedirectTarget(targetUrl: string): UrlValidationResult {
  return validateUrl(targetUrl);
}