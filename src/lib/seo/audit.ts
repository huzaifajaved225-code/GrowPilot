import { SeoAuditRequest, SeoAuditResult } from "./types";

export async function runSeoAudit(
  data: SeoAuditRequest
): Promise<SeoAuditResult> {
  console.log("Running SEO Audit:", data.website);

  return {
    score: 0,
    issues: 0,
    warnings: 0,
    suggestions: 0,
  };
}