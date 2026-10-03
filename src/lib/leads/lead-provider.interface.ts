/**
 * Criteria for discovering candidate business leads.
 */
export interface LeadDiscoveryCriteria {
  readonly industry: string;
  readonly location: string;
  readonly targetCustomer?: string;
  readonly website?: string;
  readonly count?: number;
}

/**
 * Raw candidate lead discovered before AI qualification.
 */
export interface DiscoveredLeadCandidate {
  readonly businessName: string;
  readonly industry: string;
  readonly location: string;
  readonly targetCustomer?: string;
  readonly website?: string;
  readonly description?: string;
  readonly source: string;
}

/**
 * Provider interface for lead discovery services (e.g. Google Places, Apollo, Hunter, Mock).
 */
export interface ILeadDataProvider {
  readonly providerId: string;
  discoverLeads(criteria: LeadDiscoveryCriteria): Promise<DiscoveredLeadCandidate[]>;
}
