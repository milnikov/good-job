#!/usr/bin/env tsx
/**
 * Idempotent ingest CLI (free sources only in v1).
 * Usage:
 *   npm run ingest -- discover --domain example.com --name "Example"
 *   npm run ingest -- publish --product-id prod_gridmend
 */
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
const command = args[0];
const local = !args.includes("--remote");
const d1Flag = local ? "--local" : "--remote";

function runSql(sql: string) {
  const escaped = sql.replace(/"/g, '\\"');
  execSync(`npx wrangler d1 execute good-job-db ${d1Flag} --command "${escaped}"`, {
    stdio: "inherit",
  });
}

function getArg(name: string) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function discover() {
  const domain = getArg("--domain");
  const name = getArg("--name");
  if (!domain || !name) {
    console.error("Usage: ingest discover --domain DOMAIN --name NAME");
    process.exit(1);
  }
  const id = `cand_${randomUUID().slice(0, 8)}`;
  runSql(
    `INSERT INTO ingest_candidates (id, domain, name, source_url, review_status, notes)
     VALUES ('${id}', '${domain.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}', 'https://${domain}', 'candidate', 'CLI discover')
     ON CONFLICT(id) DO NOTHING`,
  );
  console.log(`Candidate ${id} queued for ${name} (${domain})`);
}

function publish() {
  const productId = getArg("--product-id");
  if (!productId) {
    console.error("Usage: ingest publish --product-id ID");
    process.exit(1);
  }

  const checks = execSync(
    `npx wrangler d1 execute good-job-db ${d1Flag} --command "SELECT p.id, c.hq_country, (SELECT COUNT(*) FROM ux_issues WHERE product_id = p.id) as issues, (SELECT COUNT(*) FROM evidence_assets WHERE product_id = p.id) as evidence FROM products p JOIN companies c ON c.id = p.company_id WHERE p.id = '${productId}'" --json`,
    { encoding: "utf8" },
  );
  const parsed = JSON.parse(checks) as Array<{ results?: Array<Record<string, number | string>> }>;
  const row = parsed[0]?.results?.[0];
  if (row === undefined) {
    console.error("Product not found");
    process.exit(1);
  }

  const hq = String(row.hq_country ?? "");
  const issues = Number(row.issues ?? 0);
  const evidence = Number(row.evidence ?? 0);
  const europe = hq.length === 2;
  const gate = europe && issues > 0 && evidence > 0;

  if (!gate) {
    runSql(
      `UPDATE companies SET review_status = 'needs_evidence', updated_at = datetime('now') WHERE id = (SELECT company_id FROM products WHERE id = '${productId}')`,
    );
    console.error(
      "Publish gate failed: needs EU HQ, ≥1 UX issue, ≥1 evidence asset. Status set to needs_evidence.",
    );
    process.exit(2);
  }

  runSql(
    `UPDATE companies SET review_status = 'published', published_at = datetime('now'), updated_at = datetime('now') WHERE id = (SELECT company_id FROM products WHERE id = '${productId}')`,
  );

  const runId = randomUUID();
  runSql(
    `INSERT INTO ingest_runs (id, started_at, finished_at, status, message, companies_touched)
     VALUES ('${runId}', datetime('now'), datetime('now'), 'published', 'CLI publish ${productId}', 1)`,
  );

  execSync("npm run build:index", { stdio: "inherit" });
  console.log(`Published ${productId} and refreshed screener index.`);
}

function daily() {
  const runId = randomUUID();
  runSql(
    `INSERT INTO ingest_runs (id, started_at, status, message) VALUES ('${runId}', datetime('now'), 'running', 'daily noop refresh')`,
  );
  execSync("npm run build:index", { stdio: "inherit" });
  runSql(
    `UPDATE ingest_runs SET finished_at = datetime('now'), status = 'ok', message = 'index rebuilt' WHERE id = '${runId}'`,
  );
  console.log("Daily ingest completed (index rebuild).");
}

switch (command) {
  case "discover":
    discover();
    break;
  case "publish":
    publish();
    break;
  case "daily":
    daily();
    break;
  default:
    console.log(`Commands: discover | publish | daily (default flags: ${d1Flag})`);
    process.exit(command ? 1 : 0);
}
