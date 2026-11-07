import { Link } from "react-router-dom";
import type { ScreenerRow } from "@shared/types";
import { formatSalary, formatEur } from "../lib/format";
import { toggleWatchlist, loadWatchlist } from "../lib/watchlist";
import { useState } from "react";
import styles from "./Inspector.module.css";

export function Inspector({ row }: { row: ScreenerRow | null }) {
  const [watch, setWatch] = useState(() => (row ? loadWatchlist().has(row.productId) : false));

  if (!row) {
    return (
      <div className={styles.empty}>
        <p>Select a company row or scatter point.</p>
      </div>
    );
  }

  const salary = formatSalary(row.seniorSalaryMin, row.seniorSalaryMax, row.salaryCurrency);

  return (
    <div className={styles.inspector}>
      <div className={styles.head}>
        <h2 className={styles.name}>{row.name}</h2>
        <p className={styles.sub}>
          {row.sector} · {row.hqCountry}
        </p>
      </div>
      <div className={styles.scores}>
        <div>
          <span className={styles.label}>Impact</span>
          <span className={styles.scoreGood}>{row.impactScore ?? "—"}</span>
          {row.highImpact && <span className={styles.badgeGood}>High human benefit</span>}
        </div>
        <div>
          <span className={styles.label}>UX</span>
          <span className={styles.scoreBad}>{row.uxScore ?? "—"}</span>
          {row.poorUx && <span className={styles.badgeBad}>Poor UX</span>}
        </div>
      </div>
      <dl className={styles.facts}>
        <div>
          <dt>Revenue (FY)</dt>
          <dd>
            {typeof row.revenueState === "number" ? formatEur(row.annualRevenueEur) : row.revenueState}
          </dd>
        </div>
        <div>
          <dt>Design roles</dt>
          <dd>
            {typeof row.openDesignRolesState === "number"
              ? row.openDesignRolesState
              : row.openDesignRolesState}
          </dd>
        </div>
        <div>
          <dt>Senior PD salary</dt>
          <dd>{salary ?? "unknown"}</dd>
        </div>
      </dl>
      <div className={styles.thumb} aria-hidden>
        <div className={styles.thumbFrame}>[ evidence preview ]</div>
      </div>
      <div className={styles.actions}>
        <Link to={`/companies/${row.slug}`} className={styles.primary}>
          Open dossier
        </Link>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            const next = toggleWatchlist(row.productId);
            setWatch(next.has(row.productId));
          }}
        >
          {watch ? "Remove watchlist" : "Save to watchlist"}
        </button>
      </div>
      {row.isSynthetic && (
        <p className={styles.demo}>Demo record — excluded from live totals.</p>
      )}
    </div>
  );
}
