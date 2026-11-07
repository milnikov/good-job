import { Link, useLocation } from "react-router-dom";
import styles from "./AppShell.module.css";

const APP_NAME = "Good Job";

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link to="/" className={styles.wordmark}>
            {APP_NAME}
          </Link>
          <span className={styles.tagline}>European product research terminal</span>
        </div>
        <nav className={styles.nav} aria-label="Primary">
          <Link to="/" className={loc.pathname === "/" ? styles.active : undefined}>
            Companies
          </Link>
          <Link
            to="/watchlist"
            className={loc.pathname.startsWith("/watchlist") ? styles.active : undefined}
          >
            Watchlist
          </Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
