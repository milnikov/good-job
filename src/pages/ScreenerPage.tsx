import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Panel } from "../components/Panel";
import { Inspector } from "../components/Inspector";
import { ScatterImpactUx } from "../components/charts/ScatterImpactUx";
import { SectorBars } from "../components/charts/SectorBars";
import { Sparkline } from "../components/charts/Sparkline";
import { MissingValue } from "../components/MissingValue";
import { useScreenerIndex } from "../hooks/useScreenerIndex";
import {
  applyFilters,
  parseViewFromSearch,
  sectorCounts,
  viewToSearch,
} from "../lib/filters";
import { formatEur, formatPct } from "../lib/format";
import { downloadCsv, screenerToCsv } from "../lib/csv";
import { saveNamedView } from "../lib/savedViews";
import styles from "./ScreenerPage.module.css";

type SortKey = "impact" | "ux" | "revenue" | "name";

export function ScreenerPage() {
  const { data, loading, error } = useScreenerIndex();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = useMemo(() => parseViewFromSearch(searchParams), [searchParams]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("impact");
  const [sortAsc, setSortAsc] = useState(false);
  const [searchInput, setSearchInput] = useState(view.search ?? "");
  const navigate = useNavigate();

  const allRows = data?.rows ?? [];
  const filtered = useMemo(() => applyFilters(allRows, view), [allRows, view]);
  const liveCount = useMemo(() => allRows.filter((r) => !r.isSynthetic).length, [allRows]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortKey === "name") return mul * a.name.localeCompare(b.name);
      if (sortKey === "impact") return mul * ((a.impactScore ?? -1) - (b.impactScore ?? -1));
      if (sortKey === "ux") return mul * ((a.uxScore ?? 999) - (b.uxScore ?? 999));
      return mul * ((a.annualRevenueEur ?? -1) - (b.annualRevenueEur ?? -1));
    });
    return copy;
  }, [filtered, sortAsc, sortKey]);

  const selected = sorted.find((r) => r.productId === selectedId) ?? sorted[0] ?? null;

  useEffect(() => {
    if (!selectedId && sorted[0]) setSelectedId(sorted[0].productId);
  }, [sorted, selectedId]);

  const sectors = sectorCounts(filtered);
  const presetHighPoor = () => {
    const p = viewToSearch({ region: "Europe", impactMin: 80, uxMax: 40 });
    setSearchParams(p);
  };

  const toggleFilter = (key: "profitable" | "remote") => {
    const next = { ...view };
    if (key === "profitable") next.profitable = !view.profitable;
    if (key === "remote") next.remote = !view.remote;
    setSearchParams(viewToSearch(next));
  };

  const submitSearch = () => {
    const next = { ...view, search: searchInput.trim() || undefined };
    setSearchParams(viewToSearch(next));
  };

  if (loading) return <p className={styles.status}>Loading catalog…</p>;
  if (error) return <p className={styles.status}>Failed to load index: {error}</p>;

  return (
    <div className={styles.page}>
      <header className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>Company screener</h1>
          <p className={styles.subtitle}>Useful products. Difficult interfaces. Room to improve.</p>
        </div>
        <div className={styles.toolbar}>
          <button type="button" onClick={presetHighPoor}>
            High impact / poor UX
          </button>
          <button
            type="button"
            className={view.profitable ? styles.filterOn : undefined}
            onClick={() => toggleFilter("profitable")}
          >
            Profitable
          </button>
          <button
            type="button"
            className={view.remote ? styles.filterOn : undefined}
            onClick={() => toggleFilter("remote")}
          >
            Remote
          </button>
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("Save view as");
              if (!name) return;
              saveNamedView(name, view);
            }}
          >
            Save view
          </button>
          <button
            type="button"
            onClick={() =>
              downloadCsv(`good-job-export-${new Date().toISOString().slice(0, 10)}.csv`, screenerToCsv(sorted))
            }
          >
            Export CSV
          </button>
        </div>
      </header>

      <div className={styles.searchRow}>
        <input
          type="search"
          placeholder="Search company, product, sector"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch()}
          className={styles.search}
        />
        <button type="button" onClick={submitSearch}>
          Search
        </button>
        <span className={styles.meta}>
          {filtered.length} shown · {liveCount} tracked (non-demo) · sync {data?.generatedAt ?? "—"}
        </span>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          <div className={styles.chartsRow}>
            <Panel title="Human impact vs UX quality" meta={`n = ${filtered.filter((r) => r.impactScore != null && r.uxScore != null).length}`}>
              <ScatterImpactUx
                rows={filtered}
                selectedId={selected?.productId ?? null}
                onSelect={setSelectedId}
              />
            </Panel>
            <Panel title="Companies by sector">
              <SectorBars
                data={sectors}
                total={liveCount}
                visibleCount={filtered.length}
              />
            </Panel>
          </div>

          <Panel
            title="Companies"
            meta={
              <span>
                Sort:{" "}
                <button type="button" className={styles.linkBtn} onClick={() => setSortKey("impact")}>
                  impact
                </button>{" "}
                ·{" "}
                <button type="button" className={styles.linkBtn} onClick={() => setSortKey("ux")}>
                  ux
                </button>{" "}
                ·{" "}
                <button type="button" className={styles.linkBtn} onClick={() => setSortAsc((v) => !v)}>
                  {sortAsc ? "asc" : "desc"}
                </button>
              </span>
            }
          >
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.stickyCol}>Company</th>
                    <th>HQ</th>
                    <th className={styles.num}>Impact</th>
                    <th className={styles.num}>UX</th>
                    <th className={styles.num}>Revenue</th>
                    <th className={styles.num}>EBITDA</th>
                    <th className={styles.num}>YoY</th>
                    <th className={styles.num}>Roles</th>
                    <th>12m UX</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr
                      key={row.productId}
                      className={row.productId === selected?.productId ? styles.selectedRow : undefined}
                      onClick={() => setSelectedId(row.productId)}
                      onDoubleClick={() => navigate(`/companies/${row.slug}`)}
                    >
                      <td className={styles.stickyCol}>
                        <span className={styles.company}>{row.name}</span>
                        <span className={styles.sectorLine}>
                          {row.productName} · {row.sector}
                        </span>
                      </td>
                      <td>{row.hqCountry}</td>
                      <td className={styles.num}>
                        {row.impactScore ?? <MissingValue state="unknown" />}
                      </td>
                      <td className={`${styles.num} ${row.poorUx ? styles.bad : ""}`}>
                        {row.uxScore ?? <MissingValue state="unknown" />}
                      </td>
                      <td className={styles.num}>
                        {typeof row.revenueState === "number" ? formatEur(row.annualRevenueEur) : (
                          <MissingValue state={row.revenueState as "unknown"} />
                        )}
                      </td>
                      <td className={styles.num}>
                        {row.ebitdaMargin != null ? formatPct(row.ebitdaMargin, 0) : "—"}
                      </td>
                      <td className={styles.num}>
                        {row.yoyRevenueGrowth != null ? (
                          <span className={row.yoyRevenueGrowth >= 0 ? styles.good : styles.bad}>
                            {formatPct(row.yoyRevenueGrowth, 0)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={styles.num}>
                        {typeof row.openDesignRolesState === "number" ? (
                          row.openDesignRolesState
                        ) : (
                          <MissingValue state={row.openDesignRolesState} />
                        )}
                      </td>
                      <td>
                        <Sparkline values={row.uxSparkline} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <aside className={styles.inspectorCol}>
          <Panel title="Inspector">
            <Inspector row={selected} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
