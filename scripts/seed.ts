import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { seedScreenerRows, publicCollections, SEED_SYNC_AT } from "../shared/seed-catalog.ts";

const local = process.argv.includes("--local") || !process.argv.includes("--remote");
const flag = local ? "--local" : "--remote";

function esc(s: string) {
  return s.replace(/'/g, "''");
}

function run(sql: string) {
  execSync(`npx wrangler d1 execute good-job-db ${flag} --command "${sql.replace(/"/g, '\\"')}"`, {
    stdio: "inherit",
  });
}

function runFile(path: string) {
  execSync(`npx wrangler d1 execute good-job-db ${flag} --file="${path}"`, { stdio: "inherit" });
}

function main() {
  try {
    execSync(`npx wrangler d1 migrations apply good-job-db ${flag}`, { stdio: "inherit" });
  } catch {
    console.warn("Migrations may already be applied.");
  }

  const stmts: string[] = [];
  stmts.push("DELETE FROM jobs; DELETE FROM ux_issues; DELETE FROM opportunities;");
  stmts.push("DELETE FROM evidence_assets; DELETE FROM review_themes; DELETE FROM review_samples;");
  stmts.push("DELETE FROM change_log; DELETE FROM score_snapshots; DELETE FROM observations;");
  stmts.push("DELETE FROM products; DELETE FROM companies; DELETE FROM collections;");

  for (const row of seedScreenerRows) {
    stmts.push(
      `INSERT INTO companies (id, name, domain, hq_country, description, review_status, is_synthetic, published_at)
       VALUES ('${row.companyId}', '${esc(row.name)}', '${esc(row.name.toLowerCase())}.example.eu', '${row.hqCountry}', 'Useful product, difficult interface.', 'published', ${row.isSynthetic ? 1 : 0}, '${SEED_SYNC_AT}');`,
    );
    stmts.push(
      `INSERT INTO products (id, company_id, name, slug, sector)
       VALUES ('${row.productId}', '${row.companyId}', '${esc(row.productName)}', '${row.slug}', '${esc(row.sector)}');`,
    );

    if (row.impactScore != null) {
      stmts.push(
        `INSERT INTO score_snapshots (id, product_id, score_type, score, method_version, rationale, evidence_ids_json, assessed_at)
         VALUES ('score_${row.productId}_impact', '${row.productId}', 'impact', ${row.impactScore}, 'I1.1', 'Editorial rubric I1 with cited evidence.', '[]', '2026-11-01');`,
      );
    }
    if (row.uxScore != null) {
      stmts.push(
        `INSERT INTO score_snapshots (id, product_id, score_type, score, method_version, rationale, evidence_ids_json, assessed_at)
         VALUES ('score_${row.productId}_ux', '${row.productId}', 'ux', ${row.uxScore}, 'U1.1', 'Working-interface review with multiple workflows.', '["ev_${row.productId}_1"]', '2026-11-01');`,
      );
    }

    if (row.annualRevenueEur != null) {
      stmts.push(
        `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, source_url, retrieved_at, period_start, review_status)
         VALUES ('obs_${row.productId}_rev', 'product', '${row.productId}', 'revenue_fy_eur', '{"value":${row.annualRevenueEur}}', 'reported', 'https://example.eu/annual-report', '2026-10-15', '2025-01-01', 'published');`,
      );
      stmts.push(
        `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, retrieved_at, period_start, review_status)
         VALUES ('obs_${row.productId}_ltm', 'product', '${row.productId}', 'revenue_ltm_eur', '{"value":${row.annualRevenueEur}}', 'calculated', '2026-10-15', '2025-01-01', 'published');`,
      );
    }

    if (row.yoyRevenueGrowth != null) {
      stmts.push(
        `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, retrieved_at, review_status)
         VALUES ('obs_${row.productId}_yoy', 'product', '${row.productId}', 'revenue_yoy', '{"value":${row.yoyRevenueGrowth}}', 'calculated', '2026-10-15', 'published');`,
      );
    }

    if (row.seniorSalaryMin != null && row.seniorSalaryMax != null) {
      stmts.push(
        `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, retrieved_at, review_status)
         VALUES ('obs_${row.productId}_sal', 'product', '${row.productId}', 'senior_pd_salary', '{"min":${row.seniorSalaryMin},"max":${row.seniorSalaryMax},"currency":"${row.salaryCurrency ?? "EUR"}","location":"${row.hqCountry}"}', 'reported', '2026-11-07', 'published');`,
      );
    }

    stmts.push(
      `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, retrieved_at, review_status)
       VALUES ('obs_${row.companyId}_hc', 'company', '${row.companyId}', 'headcount_total', '{"value":142}', 'reported', '2026-09-01', 'published');`,
    );

    if (row.productId === "prod_gridmend") {
      stmts.push(
        `INSERT INTO ux_issues (id, product_id, title, severity, verification_status, consequence, evidence_ids_json)
         VALUES ('issue_gm_1', 'prod_gridmend', '23 steps to triage an outage', 'high', 'verified', 'Operators lose context during incidents.', '["ev_prod_gridmend_1"]');`,
      );
      stmts.push(
        `INSERT INTO ux_issues (id, product_id, title, severity, verification_status, consequence, evidence_ids_json)
         VALUES ('issue_gm_2', 'prod_gridmend', 'Asset ID copied into another system', 'critical', 'verified', 'Risk of mis-dispatch during outages.', '["ev_prod_gridmend_1"]');`,
      );
      stmts.push(
        `INSERT INTO opportunities (id, product_id, title, priority, affected_roles, hypothesis, confidence)
         VALUES ('opp_gm_1', 'prod_gridmend', 'Incident-centered workspace', 'P1', 'Grid operators', 'Unify alarms, asset context, and next actions to cut context switching.', 'high');`,
      );
      stmts.push(
        `INSERT INTO evidence_assets (id, product_id, workflow_name, version_label, capture_at, position_index, position_total, demo_status, r2_key, thumb_r2_key)
         VALUES ('ev_prod_gridmend_1', 'prod_gridmend', 'Incident triage', 'SCADA v3.7.4', '2026-08-12T10:00:00Z', 4, 18, 'reconstruction', 'evidence/gridmend/console.png', 'evidence/gridmend/console-thumb.png');`,
      );
      stmts.push(
        `INSERT INTO review_samples (id, product_id, platform, audience, rating, rating_scale, review_count, sample_size, source_url, retrieved_at)
         VALUES ('rev_gm_c', 'prod_gridmend', 'g2', 'customer', 3.1, '5', 240, 240, 'https://example.eu/reviews', '2026-10-01');`,
      );
      stmts.push(
        `INSERT INTO review_samples (id, product_id, platform, audience, rating, rating_scale, review_count, sample_size, source_url, retrieved_at)
         VALUES ('rev_gm_e', 'prod_gridmend', 'glassdoor', 'employee', 4.2, '5', 86, 86, 'https://example.eu/employer', '2026-10-01');`,
      );
      stmts.push(
        `INSERT INTO review_themes (id, product_id, audience, theme, share_pct, sample_size)
         VALUES ('th_gm_c1', 'prod_gridmend', 'customer', 'Complex navigation', 68, 180),
                ('th_gm_c2', 'prod_gridmend', 'customer', 'Excel workarounds', 54, 180),
                ('th_gm_e1', 'prod_gridmend', 'employee', 'Legacy tooling', 41, 60);`,
      );
      stmts.push(
        `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, source_url, retrieved_at, review_status)
         VALUES ('obs_gm_quote', 'product', 'prod_gridmend', 'user_quote', '{"text":"I copy the asset ID into another system just to find out who lost power.","role":"Grid operator","sourceUrl":"https://example.eu/review/1"}', 'observed', 'https://example.eu/review/1', '2026-09-20', 'published');`,
      );
      stmts.push(
        `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, retrieved_at, review_status)
         VALUES ('obs_gm_wf', 'product', 'prod_gridmend', 'workflow_audit', '[{"name":"Triage outage","medianTimeSec":420,"steps":23,"errorRatePct":57,"severity":"critical","assessmentDepth":"expert walkthrough"}]', 'observed', '2026-08-20', 'published');`,
      );
      stmts.push(
        `INSERT INTO jobs (id, product_id, title, seniority, salary_min, salary_max, salary_currency, location, remote_policy, url, first_seen, last_seen, status)
         VALUES ('job_gm_1', 'prod_gridmend', 'Senior Product Designer', 'senior', 78000, 92000, 'EUR', 'Berlin, DE', 'hybrid DE', 'https://example.eu/careers/spd', '2026-09-01', '2026-11-07', 'open');`,
      );
      for (let y = 2022; y <= 2025; y++) {
        const rev = 12 + (y - 2022) * 2.1;
        const fte = y === 2022 ? 1 : 1;
        stmts.push(
          `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, period_start, review_status)
           VALUES ('obs_gm_rev_${y}', 'product', 'prod_gridmend', 'revenue_fy_eur', '{"value":${Math.round(rev * 1_000_000)}}', 'reported', '${y}-01-01', 'published');`,
        );
        stmts.push(
          `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, period_start, review_status)
           VALUES ('obs_gm_fte_${y}', 'company', 'co_gridmend', 'design_fte', '{"value":${fte}}', 'reported', '${y}-01-01', 'published');`,
        );
        stmts.push(
          `INSERT INTO observations (id, entity_type, entity_id, field_key, value_json, value_type, period_start, review_status)
           VALUES ('obs_gm_staff_${y}', 'company', 'co_gridmend', 'headcount_total', '{"value":${120 + (y - 2022) * 7}}', 'reported', '${y}-01-01', 'published');`,
        );
      }
      stmts.push(
        `INSERT INTO change_log (id, product_id, changed_at, field_key, summary, source_url)
         VALUES ('chg_gm_1', 'prod_gridmend', '2026-10-01', 'ux_score', 'UX score lowered after SCADA 3.7 audit.', 'https://example.eu/releases/3-7');`,
      );
    }

    if (row.openDesignRoles != null && row.openDesignRoles > 0 && row.productId !== "prod_gridmend") {
      stmts.push(
        `INSERT INTO jobs (id, product_id, title, seniority, salary_min, salary_max, salary_currency, location, remote_policy, url, first_seen, last_seen, status)
         VALUES ('job_${row.productId}', '${row.productId}', 'Product Designer', 'mid', ${row.seniorSalaryMin ?? 0}, ${row.seniorSalaryMax ?? 0}, '${row.salaryCurrency ?? "EUR"}', '${row.hqCountry}', 'hybrid', 'https://example.eu/careers', '2026-10-01', '2026-11-07', 'open');`,
      );
    }
  }

  for (const col of publicCollections) {
    stmts.push(
      `INSERT INTO collections (id, slug, name, filter_json)
       VALUES ('col_${col.slug}', '${col.slug}', '${esc(col.name)}', '${esc(JSON.stringify(col.filter))}');`,
    );
  }

  const tmp = join(process.cwd(), "scripts", ".seed-batch.sql");
  writeFileSync(tmp, stmts.join("\n"), "utf8");
  for (const s of stmts.slice(0, 6)) {
    run(s);
  }
  writeFileSync(tmp, stmts.slice(6).join("\n"), "utf8");
  runFile(tmp);

  execSync("npm run build:index", { stdio: "inherit" });

  const collectionsPath = join(process.cwd(), "public", "data", "collections.json");
  mkdirSync(join(process.cwd(), "public", "data"), { recursive: true });
  writeFileSync(collectionsPath, JSON.stringify(publicCollections, null, 2));

  console.log(`Seed complete (${flag}).`);
}

main();
