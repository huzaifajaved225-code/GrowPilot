export interface SeoAuditRequest {
  website: string;
}

export interface SeoAuditResult {
  score: number;
  issues: number;
  warnings: number;
  suggestions: number;
}