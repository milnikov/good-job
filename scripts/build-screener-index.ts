import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type { ScreenerIndex, ScreenerRow } from "../shared/types.ts";
import { SEED_SYNC_AT, seedScreenerRows } from "../shared/seed-catalog.ts";

async function loadFromD1(): Promise<ScreenerRow[] | null> {
  try {
    const out = execSync(
      `npx wrangler d1 execute good-job-db --local --command "SELECT p.id as productId, p.slug, c.id as companyId, c.name, p.name as productName, p.sector, c.hq_country as hqCountry, c.is_synthetic as isSynthetic FROM products p JOIN companies c ON c.id = p.company_id WHERE c.review_status = 'published'" --json`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const parsed = JSON.parse(out) as Array<{ results?: Array<Record<string, unknown>> }>;
    const rows = parsed[0]?.results ?? [];
    if (!rows.length) return null;

    return rows.map((r: Record<string, unknown>) => {
      const isSynthetic = Number(r.isSynthetic) === 1;
      const seed = seedScreenerRows.find((s) => s.productId === String(r.productId));
      if (seed) return { ...seed, isSynthetic };
      return {
        productId: String(r.productId),
        companyId: String(r.companyId),
        name: String(r.name),
        productName: String(r.productName),
        sector: String(r.sector ?? "unknown"),
        hqCountry: String(r.hqCountry ?? "unknown"),
        impactScore: null,
        uxScore: null,
        highImpact: false,
        poorUx: false,
        profitable: null,
        profitableState: "unknown" as const,
        remoteAvailable: null,
        remoteState: "unknown" as const,
        openDesignRoles: null,
        openDesignRolesState: "unknown" as const,
        annualRevenueEur: null,
        revenueState: "unknown" as const,
        ebitdaMargin: null,
        yoyRevenueGrowth: null,
        customerRating: null,
        employeeRating: null,
        seniorSalaryMin: null,
        seniorSalaryMax: null,
        salaryCurrency: null,
        uxSparkline: [],
        isSynthetic,
        slug: String(r.slug),
        lastSyncAt: SEED_SYNC_AT,
      };
    });
  } catch {
    return null;
  }
}

async function main() {
  const fromDb = await loadFromD1();
  const index: ScreenerIndex = {
    generatedAt: new Date().toISOString(),
    rows: fromDb ?? seedScreenerRows,
  };

  const dir = join(process.cwd(), "public", "data");
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, "screener-index.json");
  writeFileSync(outPath, JSON.stringify(index, null, 2), "utf8");
  console.log(`Wrote ${index.rows.length} rows to ${outPath}`);
}

main();
