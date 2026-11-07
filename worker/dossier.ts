import type { DossierSummary } from "@shared/types";
import { evidenceApiPath } from "./r2";

type Row = Record<string, unknown>;

export async function getDossier(
  db: D1Database,
  slugOrId: string,
): Promise<DossierSummary | null> {
  const product = await db
    .prepare(
      `SELECT p.id, p.slug, p.name AS product_name, p.sector,
              c.id AS company_id, c.name AS company_name, c.domain, c.hq_country,
              c.description, c.is_synthetic
       FROM products p
       JOIN companies c ON c.id = p.company_id
       WHERE p.slug = ? OR p.id = ?
       LIMIT 1`,
    )
    .bind(slugOrId, slugOrId)
    .first<Row>();

  if (!product) return null;

  const productId = String(product.id);

  const impact = await latestScore(db, productId, "impact");
  const ux = await latestScore(db, productId, "ux");

  const issues = await db
    .prepare(
      `SELECT id, title, severity, verification_status, consequence, evidence_ids_json
       FROM ux_issues WHERE product_id = ? ORDER BY created_at`,
    )
    .bind(productId)
    .all<Row>();

  const opportunities = await db
    .prepare(
      `SELECT id, title, priority, affected_roles, hypothesis, confidence
       FROM opportunities WHERE product_id = ?`,
    )
    .bind(productId)
    .all<Row>();

  const evidenceRows = await db
    .prepare(
      `SELECT id, workflow_name, version_label, capture_at, position_index, position_total, demo_status, r2_key, thumb_r2_key
       FROM evidence_assets WHERE product_id = ? AND review_status = 'published' ORDER BY position_index`,
    )
    .bind(productId)
    .all<Row>();

  const jobs = await db
    .prepare(
      `SELECT id, title, seniority, salary_min, salary_max, salary_currency, location, remote_policy, url, status, last_seen
       FROM jobs WHERE product_id = ? ORDER BY last_seen DESC`,
    )
    .bind(productId)
    .all<Row>();

  const customerReview = await db
    .prepare(
      `SELECT rating, review_count, sample_size, source_url FROM review_samples
       WHERE product_id = ? AND audience = 'customer' LIMIT 1`,
    )
    .bind(productId)
    .first<Row>();

  const employeeReview = await db
    .prepare(
      `SELECT rating, review_count, sample_size, source_url FROM review_samples
       WHERE product_id = ? AND audience = 'employee' LIMIT 1`,
    )
    .bind(productId)
    .first<Row>();

  const themesCustomer = await db
    .prepare(
      `SELECT theme, share_pct, sample_size FROM review_themes
       WHERE product_id = ? AND audience = 'customer'`,
    )
    .bind(productId)
    .all<Row>();

  const themesEmployee = await db
    .prepare(
      `SELECT theme, share_pct, sample_size FROM review_themes
       WHERE product_id = ? AND audience = 'employee'`,
    )
    .bind(productId)
    .all<Row>();

  const changeLog = await db
    .prepare(
      `SELECT changed_at, field_key, summary, source_url FROM change_log
       WHERE product_id = ? ORDER BY changed_at DESC LIMIT 50`,
    )
    .bind(productId)
    .all<Row>();

  const headcountObs = await observation(db, "company", String(product.company_id), "headcount_total");
  const ltmRevenue = await observation(db, "product", productId, "revenue_ltm_eur");
  const yoy = await observation(db, "product", productId, "revenue_yoy");
  const salary = await observation(db, "product", productId, "senior_pd_salary");

  const financialYears = await db
    .prepare(
      `SELECT field_key, value_json, period_start, period_end, source_url, retrieved_at, value_type
       FROM observations
       WHERE entity_type = 'product' AND entity_id = ? AND field_key IN ('revenue_fy_eur', 'ebit_margin')
       ORDER BY period_start`,
    )
    .bind(productId)
    .all<Row>();

  const workforceYears = await db
    .prepare(
      `SELECT field_key, value_json, period_start FROM observations
       WHERE entity_type = 'company' AND entity_id = ? AND field_key IN ('design_fte', 'headcount_total')
       ORDER BY period_start`,
    )
    .bind(String(product.company_id))
    .all<Row>();

  const openRoles = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM jobs WHERE product_id = ? AND status = 'open' AND title LIKE '%Design%'`,
    )
    .bind(productId)
    .first<{ c: number }>();

  const quoteRow = await db
    .prepare(
      `SELECT value_json FROM observations WHERE entity_type = 'product' AND entity_id = ? AND field_key = 'user_quote' LIMIT 1`,
    )
    .bind(productId)
    .first<Row>();

  const workflows = await db
    .prepare(
      `SELECT value_json FROM observations WHERE entity_type = 'product' AND entity_id = ? AND field_key = 'workflow_audit'`,
    )
    .bind(productId)
    .all<Row>();

  const impactScore = impact?.score ?? null;
  const uxScore = ux?.score ?? null;

  return {
    productId,
    slug: String(product.slug),
    companyName: String(product.company_name),
    productName: String(product.product_name),
    tagline: product.description ? String(product.description) : null,
    hqCountry: product.hq_country ? String(product.hq_country) : null,
    headcount: parseNum(headcountObs?.value),
    headcountState: headcountObs ? parseNum(headcountObs.value) ?? "unknown" : "unknown",
    sector: product.sector ? String(product.sector) : null,
    domain: product.domain ? String(product.domain) : null,
    impactScore,
    uxScore,
    impactRationale: impact?.rationale ?? null,
    uxRationale: ux?.rationale ?? null,
    highImpact: impactScore !== null && impactScore >= 80,
    poorUx: uxScore !== null && uxScore < 40,
    criticalUxDebt: (issues.results ?? []).some(
      (i) => String(i.severity).toLowerCase() === "critical",
    ),
    isSynthetic: Number(product.is_synthetic) === 1,
    customerRating: customerReview?.rating != null ? Number(customerReview.rating) : null,
    customerReviewCount:
      customerReview?.review_count != null ? Number(customerReview.review_count) : null,
    employeeRating: employeeReview?.rating != null ? Number(employeeReview.rating) : null,
    employeeReviewCount:
      employeeReview?.review_count != null ? Number(employeeReview.review_count) : null,
    ltmRevenueEur: parseNum(ltmRevenue?.value),
    ltmLabel: ltmRevenue ? "LTM" : "FY",
    yoyGrowth: parseNum(yoy?.value),
    seniorSalaryMin: salary?.min ?? null,
    seniorSalaryMax: salary?.max ?? null,
    salaryCurrency: salary?.currency ?? null,
    salaryLocation: salary?.location ?? null,
    openDesignRoles: openRoles?.c ?? null,
    issues: (issues.results ?? []).map((i) => ({
      id: String(i.id),
      title: String(i.title),
      severity: i.severity ? String(i.severity) : null,
      verificationStatus: String(i.verification_status),
      consequence: i.consequence ? String(i.consequence) : null,
      evidenceIds: parseJsonArray(i.evidence_ids_json),
    })),
    opportunities: (opportunities.results ?? []).map((o) => ({
      id: String(o.id),
      title: String(o.title),
      priority: o.priority ? String(o.priority) : null,
      affectedRoles: o.affected_roles ? String(o.affected_roles) : null,
      hypothesis: o.hypothesis ? String(o.hypothesis) : null,
      confidence: o.confidence ? String(o.confidence) : null,
    })),
    evidence: (evidenceRows.results ?? []).map((e) => ({
      id: String(e.id),
      workflowName: e.workflow_name ? String(e.workflow_name) : null,
      versionLabel: e.version_label ? String(e.version_label) : null,
      captureAt: e.capture_at ? String(e.capture_at) : null,
      positionIndex: e.position_index != null ? Number(e.position_index) : null,
      positionTotal: e.position_total != null ? Number(e.position_total) : null,
      demoStatus: String(e.demo_status),
      thumbUrl: e.thumb_r2_key ? evidenceApiPath(String(e.thumb_r2_key)) : null,
      fullUrl: e.r2_key ? evidenceApiPath(String(e.r2_key)) : null,
    })),
    financials: buildFinancialSeries(financialYears.results ?? []),
    workforce: buildWorkforceSeries(workforceYears.results ?? []),
    complaintThemesCustomer: mapThemes(themesCustomer.results ?? []),
    complaintThemesEmployee: mapThemes(themesEmployee.results ?? []),
    jobs: (jobs.results ?? []).map((j) => ({
      id: String(j.id),
      title: String(j.title),
      seniority: j.seniority ? String(j.seniority) : null,
      salaryMin: j.salary_min != null ? Number(j.salary_min) : null,
      salaryMax: j.salary_max != null ? Number(j.salary_max) : null,
      currency: j.salary_currency ? String(j.salary_currency) : null,
      location: j.location ? String(j.location) : null,
      remotePolicy: j.remote_policy ? String(j.remote_policy) : null,
      url: j.url ? String(j.url) : null,
      status: String(j.status),
      lastSeen: String(j.last_seen),
    })),
    changeLog: (changeLog.results ?? []).map((c) => ({
      changedAt: String(c.changed_at),
      fieldKey: String(c.field_key),
      summary: String(c.summary),
      sourceUrl: c.source_url ? String(c.source_url) : null,
    })),
    userQuote: parseQuote(quoteRow?.value_json),
    workflows: parseWorkflows(workflows.results ?? []),
  };
}

async function latestScore(db: D1Database, productId: string, scoreType: string) {
  const row = await db
    .prepare(
      `SELECT score, rationale, assessed_at FROM score_snapshots
       WHERE product_id = ? AND score_type = ? AND review_status = 'published'
       ORDER BY assessed_at DESC LIMIT 1`,
    )
    .bind(productId, scoreType)
    .first<{ score: number; rationale: string | null }>();
  return row ?? null;
}

async function observation(db: D1Database, entityType: string, entityId: string, fieldKey: string) {
  const row = await db
    .prepare(
      `SELECT value_json FROM observations
       WHERE entity_type = ? AND entity_id = ? AND field_key = ?
       ORDER BY retrieved_at DESC LIMIT 1`,
    )
    .bind(entityType, entityId, fieldKey)
    .first<{ value_json: string }>();
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value_json) as Record<string, unknown>;
    return {
      value: parsed.value,
      min: parsed.min as number | undefined,
      max: parsed.max as number | undefined,
      currency: parsed.currency as string | undefined,
      location: parsed.location as string | undefined,
    };
  } catch {
    return { value: row.value_json };
  }
}

function parseNum(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseJsonArray(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(String(raw));
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function mapThemes(rows: Row[]) {
  return rows.map((t) => ({
    theme: String(t.theme),
    sharePct: t.share_pct != null ? Number(t.share_pct) : null,
    sampleSize: t.sample_size != null ? Number(t.sample_size) : null,
  }));
}

function buildFinancialSeries(rows: Row[]) {
  const byYear = new Map<string, { revenueEur: number | null; ebitMargin: number | null }>();
  for (const r of rows) {
    const year = String(r.period_start ?? "").slice(0, 4) || "unknown";
    if (!byYear.has(year)) byYear.set(year, { revenueEur: null, ebitMargin: null });
    const entry = byYear.get(year)!;
    const val = parseNum(JSON.parse(String(r.value_json)).value ?? r.value_json);
    if (r.field_key === "revenue_fy_eur") entry.revenueEur = val;
    if (r.field_key === "ebit_margin") entry.ebitMargin = val;
  }
  return [...byYear.entries()].map(([year, v]) => ({
    year,
    revenueEur: v.revenueEur,
    ebitMargin: v.ebitMargin,
    provenance: null,
  }));
}

function buildWorkforceSeries(rows: Row[]) {
  const byYear = new Map<string, { designFte: number | null; totalStaff: number | null }>();
  for (const r of rows) {
    const year = String(r.period_start ?? "").slice(0, 4) || "unknown";
    if (!byYear.has(year)) byYear.set(year, { designFte: null, totalStaff: null });
    const entry = byYear.get(year)!;
    const val = parseNum(JSON.parse(String(r.value_json)).value);
    if (r.field_key === "design_fte") entry.designFte = val;
    if (r.field_key === "headcount_total") entry.totalStaff = val;
  }
  return [...byYear.entries()].map(([year, v]) => ({
    year,
    designFte: v.designFte,
    totalStaff: v.totalStaff,
  }));
}

function parseQuote(raw: unknown) {
  if (!raw) return null;
  try {
    const q = JSON.parse(String(raw)) as { text: string; role?: string; sourceUrl?: string };
    if (!q.text) return null;
    return { text: q.text, role: q.role ?? null, sourceUrl: q.sourceUrl ?? null };
  } catch {
    return null;
  }
}

function parseWorkflows(rows: Row[]) {
  const out: DossierSummary["workflows"] = [];
  for (const r of rows) {
    try {
      const list = JSON.parse(String(r.value_json)) as DossierSummary["workflows"];
      if (Array.isArray(list)) out.push(...list);
    } catch {
      /* skip */
    }
  }
  return out;
}
