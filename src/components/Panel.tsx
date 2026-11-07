import styles from "./Panel.module.css";

export function Panel({
  title,
  meta,
  children,
  className,
}: {
  title?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.panel} ${className ?? ""}`}>
      {(title || meta) && (
        <header className={styles.head}>
          {title ? <h2 className={styles.title}>{title}</h2> : <span />}
          {meta ? <div className={styles.meta}>{meta}</div> : null}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
