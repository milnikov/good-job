import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useScreenerIndex } from "../hooks/useScreenerIndex";
import { applyFilters } from "../lib/filters";
import { loadWatchlist } from "../lib/watchlist";
import { Panel } from "../components/Panel";
import styles from "./WatchlistPage.module.css";

export function WatchlistPage() {
  const { data, loading } = useScreenerIndex();
  const [watchRev, setWatchRev] = useState(0);
  const watch = useMemo(() => loadWatchlist(), [watchRev]);

  const rows = useMemo(() => {
    if (!data) return [];
    return applyFilters(data.rows, {}, watch);
  }, [data, watch]);

  if (loading) return <p>Loading…</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Watchlist</h1>
      <p className={styles.sub}>Stored locally in this browser — no account.</p>
      <Panel title={`Saved companies (${watch.size})`}>
        {rows.length === 0 ? (
          <p className={styles.empty}>No companies saved. Use “Save to watchlist” on the screener.</p>
        ) : (
          <ul className={styles.list}>
            {rows.map((r) => (
              <li key={r.productId}>
                <Link to={`/companies/${r.slug}`}>
                  {r.name} — {r.productName}
                </Link>
                <span className={styles.meta}>
                  impact {r.impactScore ?? "—"} · ux {r.uxScore ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className={styles.refresh} onClick={() => setWatchRev((v) => v + 1)}>
          Refresh list
        </button>
      </Panel>
    </div>
  );
}
