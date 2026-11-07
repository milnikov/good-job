import styles from "./Segmented.module.css";

export type SegmentOption<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className={styles.wrap} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={value === opt.value ? styles.active : undefined}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
