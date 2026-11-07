import type { SavedViewState, ScreenerRow } from "@shared/types";

const EU_COUNTRIES = new Set([
  "DE",
  "NL",
  "FR",
  "SE",
  "FI",
  "DK",
  "ES",
  "IT",
  "PL",
  "AT",
  "BE",
  "PT",
  "IE",
  "CZ",
  "RO",
  "HU",
  "GR",
  "SK",
  "BG",
  "HR",
  "LT",
  "LV",
  "EE",
  "SI",
  "LU",
  "MT",
  "CY",
  "CH",
  "GB",
  "NO",
  "IS",
]);

export function parseViewFromSearch(params: URLSearchParams): SavedViewState {
  const view: SavedViewState = {};
  const region = params.get("region");
  if (region) view.region = region;
  const impactMin = params.get("impactMin");
  if (impactMin) view.impactMin = Number(impactMin);
  const uxMax = params.get("uxMax");
  if (uxMax) view.uxMax = Number(uxMax);
  if (params.get("profitable") === "1") view.profitable = true;
  if (params.get("remote") === "1") view.remote = true;
  const search = params.get("q");
  if (search) view.search = search;
  const collection = params.get("collection");
  if (collection) view.collection = collection;
  return view;
}

export function viewToSearch(view: SavedViewState): URLSearchParams {
  const p = new URLSearchParams();
  if (view.region) p.set("region", view.region);
  if (view.impactMin != null) p.set("impactMin", String(view.impactMin));
  if (view.uxMax != null) p.set("uxMax", String(view.uxMax));
  if (view.profitable) p.set("profitable", "1");
  if (view.remote) p.set("remote", "1");
  if (view.search) p.set("q", view.search);
  if (view.collection) p.set("collection", view.collection);
  return p;
}

export function applyFilters(rows: ScreenerRow[], view: SavedViewState, watchlistOnly?: Set<string>) {
  let out = [...rows];

  if (watchlistOnly) {
    out = out.filter((r) => watchlistOnly.has(r.productId));
  }

  if (view.region === "Europe") {
    out = out.filter((r) => EU_COUNTRIES.has(r.hqCountry));
  }

  if (view.impactMin != null) {
    out = out.filter((r) => r.impactScore != null && r.impactScore >= view.impactMin!);
  }

  if (view.uxMax != null) {
    out = out.filter((r) => r.uxScore != null && r.uxScore <= view.uxMax!);
  }

  if (view.profitable) {
    out = out.filter((r) => r.profitable === true);
  }

  if (view.remote) {
    out = out.filter((r) => r.remoteAvailable === true);
  }

  if (view.search?.trim()) {
    const q = view.search.trim().toLowerCase();
    out = out.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.sector.toLowerCase().includes(q),
    );
  }

  return out;
}

export function sectorCounts(rows: ScreenerRow[]) {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.sector, (map.get(r.sector) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
