import type { MissingState } from "@shared/types";

export function MissingValue({
  state,
  className,
}: {
  state: MissingState | string;
  className?: string;
}) {
  const label =
    state === "undisclosed" ||
    state === "inaccessible" ||
    state === "stale" ||
    state === "unknown"
      ? state
      : String(state);
  return (
    <span className={className} title={`Value state: ${label}`}>
      {label}
    </span>
  );
}
