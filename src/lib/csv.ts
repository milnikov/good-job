import type { ScreenerRow } from "@shared/types";
import { formatPct } from "./format";

export function screenerToCsv(rows: ScreenerRow[]) {
  const header = [
    "product_id",
    "company",
    "product",
    "sector",
    "hq",
    "impact_score",
    "ux_score",
    "revenue_eur",
    "revenue_state",
    "ebitda_margin",
    "yoy_growth",
    "open_design_roles",
    "roles_state",
    "last_sync",
    "synthetic",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.productId,
        csv(r.name),
        csv(r.productName),
        csv(r.sector),
        r.hqCountry,
        r.impactScore ?? "",
        r.uxScore ?? "",
        r.annualRevenueEur ?? "",
        csv(String(r.revenueState)),
        r.ebitdaMargin != null ? formatPct(r.ebitdaMargin, 1) : "",
        r.yoyRevenueGrowth != null ? formatPct(r.yoyRevenueGrowth, 0) : "",
        r.openDesignRoles ?? "",
        csv(String(r.openDesignRolesState)),
        r.lastSyncAt ?? "",
        r.isSynthetic ? "demo" : "live",
      ].join(","),
    );
  }
  return lines.join("\n");
}

function csv(v: string) {
  if (v.includes(",") || v.includes('"')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
