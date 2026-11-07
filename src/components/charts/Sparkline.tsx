export function Sparkline({ values, width = 56, height = 18 }: { values: number[]; width?: number; height?: number }) {
  if (!values.length) return <span className="muted">—</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const pts = values
    .map((v, i) => `${i * step},${height - ((v - min) / span) * (height - 2) - 1}`)
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline
        fill="none"
        stroke="var(--status-negative)"
        strokeWidth="1"
        points={pts}
      />
    </svg>
  );
}
