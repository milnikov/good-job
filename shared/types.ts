export type MissingState = "unknown" | "undisclosed" | "inaccessible" | "stale";

export type ValueType =
  | "reported"
  | "observed"
  | "calculated"
  | "estimated"
  | "editorial";

export interface ObservationProvenance {
  sourceUrl: string | null;
  sourceExcerpt: string | null;
  retrievedAt: string | null;
  validAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  valueType: ValueType;
  reviewStatus: string;
}

export interface ScreenerRow {
  productId: string;
  companyId: string;
  name: string;
  productName: string;
  sector: string;
  hqCountry: string;
  impactScore: number | null;
  uxScore: number | null;
  highImpact: boolean;
  poorUx: boolean;
  profitable: boolean | null;
  profitableState: MissingState | "yes" | "no";
  remoteAvailable: boolean | null;
  remoteState: MissingState | "yes" | "no";
  openDesignRoles: number | null;
  openDesignRolesState: MissingState | "stale" | number;
  annualRevenueEur: number | null;
  revenueState: MissingState | number;
  ebitdaMargin: number | null;
  yoyRevenueGrowth: number | null;
  customerRating: number | null;
  employeeRating: number | null;
  seniorSalaryMin: number | null;
  seniorSalaryMax: number | null;
  salaryCurrency: string | null;
  uxSparkline: number[];
  isSynthetic: boolean;
  slug: string;
  lastSyncAt: string | null;
}

export interface ScreenerIndex {
  generatedAt: string;
  rows: ScreenerRow[];
}

export interface DossierSummary {
  productId: string;
  slug: string;
  companyName: string;
  productName: string;
  tagline: string | null;
  hqCountry: string | null;
  headcount: number | null;
  headcountState: MissingState | number;
  sector: string | null;
  domain: string | null;
  impactScore: number | null;
  uxScore: number | null;
  impactRationale: string | null;
  uxRationale: string | null;
  highImpact: boolean;
  poorUx: boolean;
  criticalUxDebt: boolean;
  isSynthetic: boolean;
  customerRating: number | null;
  customerReviewCount: number | null;
  employeeRating: number | null;
  employeeReviewCount: number | null;
  ltmRevenueEur: number | null;
  ltmLabel: string;
  yoyGrowth: number | null;
  seniorSalaryMin: number | null;
  seniorSalaryMax: number | null;
  salaryCurrency: string | null;
  salaryLocation: string | null;
  openDesignRoles: number | null;
  issues: UxIssueDto[];
  opportunities: OpportunityDto[];
  evidence: EvidenceDto[];
  financials: FinancialPointDto[];
  workforce: WorkforcePointDto[];
  complaintThemesCustomer: ThemeDto[];
  complaintThemesEmployee: ThemeDto[];
  jobs: JobDto[];
  changeLog: ChangeLogDto[];
  userQuote: QuoteDto | null;
  workflows: WorkflowAuditDto[];
}

export interface UxIssueDto {
  id: string;
  title: string;
  severity: string | null;
  verificationStatus: string;
  consequence: string | null;
  evidenceIds: string[];
}

export interface OpportunityDto {
  id: string;
  title: string;
  priority: string | null;
  affectedRoles: string | null;
  hypothesis: string | null;
  confidence: string | null;
}

export interface EvidenceDto {
  id: string;
  workflowName: string | null;
  versionLabel: string | null;
  captureAt: string | null;
  positionIndex: number | null;
  positionTotal: number | null;
  demoStatus: string;
  thumbUrl: string | null;
  fullUrl: string | null;
}

export interface FinancialPointDto {
  year: string;
  revenueEur: number | null;
  ebitMargin: number | null;
  provenance: ObservationProvenance | null;
}

export interface WorkforcePointDto {
  year: string;
  designFte: number | null;
  totalStaff: number | null;
}

export interface ThemeDto {
  theme: string;
  sharePct: number | null;
  sampleSize: number | null;
}

export interface JobDto {
  id: string;
  title: string;
  seniority: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  location: string | null;
  remotePolicy: string | null;
  url: string | null;
  status: string;
  lastSeen: string;
}

export interface ChangeLogDto {
  changedAt: string;
  fieldKey: string;
  summary: string;
  sourceUrl: string | null;
}

export interface QuoteDto {
  text: string;
  role: string | null;
  sourceUrl: string | null;
}

export interface WorkflowAuditDto {
  name: string;
  medianTimeSec: number | null;
  steps: number | null;
  errorRatePct: number | null;
  severity: string | null;
  assessmentDepth: string;
}

export interface SavedViewState {
  region?: string;
  impactMin?: number;
  uxMax?: number;
  profitable?: boolean;
  remote?: boolean;
  search?: string;
  collection?: string;
}
