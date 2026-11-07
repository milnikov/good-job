import styles from "./charts.module.css";

export function SectorBars({
  data,
  total,
  visibleCount,
}: {
  data: [string, number][];
  total: number;
  visibleCount: number;
}) {
  const max = data[0]?.[1] ?? 1;
  return (
    <div className={styles.sectorList}>
      {data.map(([sector, count]) => (
        <div key={sector} className={styles.sectorRow}>
          <span className={styles.sectorName}>{sector}</span>
          <div className={styles.sectorTrack} aria-hidden>
            <div
              className={styles.sectorFill}
              style={{ width: `${(count / max) * 100}%` }}
            />
            <div
              className={styles.sectorHatch}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className={styles.sectorCount}>
            {count} <span className={styles.muted}>({total ? Math.round((count / total) * 100) : 0}%)</span>
          </span>
        </div>
      ))}
      <p className={styles.caption}>
        Live total: {total} (non-demo) · {visibleCount} shown after filters
      </p>
    </div>
  );
}
