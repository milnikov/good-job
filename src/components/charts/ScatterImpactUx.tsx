import type { ScreenerRow } from "@shared/types";
import styles from "./charts.module.css";

const W = 320;
const H = 220;
const PAD = 28;

export function ScatterImpactUx({
  rows,
  selectedId,
  onSelect,
}: {
  rows: ScreenerRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const points = rows.filter((r) => r.impactScore != null && r.uxScore != null);
  const n = points.length;

  const x = (impact: number) => PAD + ((impact / 100) * (W - PAD * 2));
  const y = (ux: number) => H - PAD - ((ux / 100) * (H - PAD * 2));

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label="Impact versus UX scatter">
        <defs>
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chart-ink)" strokeOpacity="0.35" />
          </pattern>
        </defs>
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g} opacity={0.35}>
            <line x1={x(g)} y1={PAD} x2={x(g)} y2={H - PAD} stroke="var(--border)" />
            <line x1={PAD} y1={y(g)} x2={W - PAD} y2={y(g)} stroke="var(--border)" />
          </g>
        ))}
        <rect
          x={x(80)}
          y={PAD}
          width={x(100) - x(80)}
          height={y(40) - PAD}
          fill="url(#hatch)"
          opacity={0.5}
        />
        <text x={x(81)} y={PAD + 12} className={styles.axisLabel}>
          impact ≥80, ux &lt;40
        </text>
        {points.map((p) => {
          const cx = x(p.impactScore!);
          const cy = y(p.uxScore!);
          const active = selectedId === p.productId;
          return (
            <g key={p.productId}>
              <circle
                cx={cx}
                cy={cy}
                r={active ? 5 : 4}
                fill={active ? "var(--text)" : "var(--chart-ink)"}
                className={styles.point}
                onClick={() => onSelect(p.productId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(p.productId);
                }}
                aria-label={`${p.name}, impact ${p.impactScore}, UX ${p.uxScore}`}
              />
            </g>
          );
        })}
        <text x={PAD} y={H - 6} className={styles.axisLabel}>
          impact →
        </text>
        <text x={4} y={PAD} className={styles.axisLabel}>
          ux ↑
        </text>
      </svg>
      <p className={styles.caption}>n = {n} (plotted population)</p>
    </div>
  );
}
