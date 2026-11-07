import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DossierSummary } from "@shared/types";
import { Panel } from "../components/Panel";
import { Segmented } from "../components/Segmented";
import { MissingValue } from "../components/MissingValue";
import { formatEur } from "../lib/format";
import styles from "./DossierPage.module.css";

type Tab = "overview" | "ux" | "financials" | "people" | "changelog";

const TABS: { value: Tab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "ux", label: "UX evidence" },
  { value: "financials", label: "Financials" },
  { value: "people", label: "People & salaries" },
  { value: "changelog", label: "Change log" },
];

export function DossierPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<DossierSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(res.status === 404 ? "Company not found" : `HTTP ${res.status}`);
        const json = (await res.json()) as DossierSummary;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <p>
        {error}. <Link to="/">Back to screener</Link>
      </p>
    );
  }

  if (!data) return <p className={styles.muted}>Loading dossier…</p>;

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <Link to="/" className={styles.back}>
            ← Screener
          </Link>
          <h1 className={styles.title}>
            {data.companyName} — {data.productName}
          </h1>
          <p className={styles.sub}>
            {data.sector ?? "—"} · {data.hqCountry ?? "—"}
            {data.headcount != null ? ` · ${data.headcount} staff` : ""}
          </p>
          {(data.highImpact || data.poorUx) && (
            <div className={styles.callout}>
              {data.highImpact && <span className={styles.good}>High human impact</span>}
              {data.poorUx && <span className={styles.bad}>Poor UX</span>}
              {data.criticalUxDebt && <span className={styles.bad}>Critical UX debt</span>}
            </div>
          )}
        </div>
        <div className={styles.kpiRow}>
          <Kpi label="Impact" value={data.impactScore} tone="good" />
          <Kpi label="UX quality" value={data.uxScore} tone="bad" />
          <Kpi label="Customer" value={data.customerRating} suffix="/5" />
          <Kpi label="Employee" value={data.employeeRating} suffix="/5" />
          <Kpi
            label={`Revenue (${data.ltmLabel})`}
            value={data.ltmRevenueEur}
            format={(v) => formatEur(v)}
          />
        </div>
      </div>

      <Segmented value={tab} options={TABS} onChange={setTab} ariaLabel="Dossier sections" />

      {tab === "overview" && (
        <div className={styles.split}>
          <Panel title="Impact rationale">
            <p>{data.impactRationale ?? "—"}</p>
          </Panel>
          <Panel title="UX rationale">
            <p>{data.uxRationale ?? "—"}</p>
          </Panel>
          {data.userQuote && (
            <Panel title="User quotation" className={styles.full}>
              <blockquote className={styles.quote}>"{data.userQuote.text}"</blockquote>
              <p className={styles.muted}>
                {data.userQuote.role ?? "unknown role"}
                {data.userQuote.sourceUrl ? (
                  <>
                    {" "}
                    ·{" "}
                    <a href={data.userQuote.sourceUrl} target="_blank" rel="noreferrer">
                      source
                    </a>
                  </>
                ) : null}
              </p>
            </Panel>
          )}
          <Panel title="Prioritized opportunities">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Title</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {data.opportunities.map((o) => (
                  <tr key={o.id}>
                    <td>{o.priority ?? "—"}</td>
                    <td>{o.title}</td>
                    <td>{o.confidence ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {tab === "ux" && (
        <div className={styles.split}>
          <Panel title="Evidence frame" meta={data.evidence[0]?.demoStatus === "reconstruction" ? "Reconstructed demo" : undefined}>
            {data.evidence[0]?.fullUrl ? (
              <img src={data.evidence[0].fullUrl} alt="Product evidence" className={styles.evidenceImg} />
            ) : (
              <div className={styles.evidencePlaceholder}>[ interface evidence ]</div>
            )}
          </Panel>
          <Panel title="Customer complaint themes" meta={themeMeta(data.complaintThemesCustomer)}>
            <ThemeBars themes={data.complaintThemesCustomer} />
          </Panel>
          <Panel title="Employee complaint themes" meta={themeMeta(data.complaintThemesEmployee)}>
            <ThemeBars themes={data.complaintThemesEmployee} />
          </Panel>
          <Panel title="Workflow audit">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Median time</th>
                  <th>Steps</th>
                  <th>Error rate</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {data.workflows.map((w) => (
                  <tr key={w.name}>
                    <td>{w.name}</td>
                    <td>{w.medianTimeSec != null ? `${w.medianTimeSec}s` : "—"}</td>
                    <td>{w.steps ?? "—"}</td>
                    <td>{w.errorRatePct != null ? `${w.errorRatePct}%` : "—"}</td>
                    <td>{w.severity ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Documented issues">
            <ul className={styles.issueList}>
              {data.issues.map((i) => (
                <li key={i.id}>
                  <strong>{i.title}</strong> ({i.verificationStatus})
                  {i.consequence ? ` — ${i.consequence}` : null}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      {tab === "financials" && (
        <Panel title="Revenue and design team size (not investment)">
          <p className={styles.muted}>FY revenue and design FTE by year — separate series and units.</p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Year</th>
                <th className={styles.num}>Revenue (EUR)</th>
                <th className={styles.num}>Design FTE</th>
                <th className={styles.num}>Staff total</th>
              </tr>
            </thead>
            <tbody>
              {mergeYearRows(data.financials, data.workforce).map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td className={styles.num}>{row.revenue != null ? formatEur(row.revenue) : "—"}</td>
                  <td className={styles.num}>{row.designFte ?? "—"}</td>
                  <td className={styles.num}>{row.staff ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {tab === "people" && (
        <div className={styles.split}>
          <Panel title="Open design roles">
            <p className={styles.bigNum}>{data.openDesignRoles ?? <MissingValue state="unknown" />}</p>
          </Panel>
          <Panel title="Senior product design salary">
            {data.seniorSalaryMin != null && data.seniorSalaryMax != null ? (
              <p>
                {data.salaryCurrency ?? "EUR"} {Math.round(data.seniorSalaryMin / 1000)}–
                {Math.round(data.seniorSalaryMax / 1000)}k ({data.salaryLocation})
              </p>
            ) : (
              <MissingValue state="unknown" />
            )}
          </Panel>
          <Panel title="Published jobs" className={styles.full}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Remote</th>
                  <th>Status</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      {j.url ? (
                        <a href={j.url} target="_blank" rel="noreferrer">
                          {j.title}
                        </a>
                      ) : (
                        j.title
                      )}
                    </td>
                    <td>{j.location ?? "—"}</td>
                    <td>{j.remotePolicy ?? "unknown"}</td>
                    <td>{j.status}</td>
                    <td>{j.lastSeen.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {tab === "changelog" && (
        <Panel title="Change log">
          <ul className={styles.issueList}>
            {data.changeLog.map((c) => (
              <li key={`${c.changedAt}-${c.fieldKey}`}>
                <time>{c.changedAt.slice(0, 10)}</time> — {c.summary}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {data.isSynthetic && <p className={styles.demoBanner}>Demo record — excluded from live totals.</p>}
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix,
  tone,
  format,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  tone?: "good" | "bad";
  format?: (v: number) => string;
}) {
  const text =
    value == null ? "—" : format ? format(value) : `${value}${suffix ?? ""}`;
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={tone === "good" ? styles.good : tone === "bad" ? styles.bad : undefined}>{text}</span>
    </div>
  );
}

function ThemeBars({ themes }: { themes: { theme: string; sharePct: number | null; sampleSize: number | null }[] }) {
  return (
    <div className={styles.themeList}>
      {themes.map((t) => (
        <div key={t.theme} className={styles.themeRow}>
          <span>{t.theme}</span>
          <div className={styles.themeTrack}>
            <div className={styles.themeFill} style={{ width: `${t.sharePct ?? 0}%` }} />
          </div>
          <span className={styles.num}>{t.sharePct != null ? `${t.sharePct}%` : "—"}</span>
        </div>
      ))}
    </div>
  );
}

function themeMeta(themes: { sampleSize: number | null }[]) {
  const n = themes[0]?.sampleSize;
  return n != null ? `sample n=${n}` : undefined;
}

function mergeYearRows(
  financials: DossierSummary["financials"],
  workforce: DossierSummary["workforce"],
) {
  const years = new Set([
    ...financials.map((f) => f.year),
    ...workforce.map((w) => w.year),
  ]);
  return [...years].sort().map((year) => {
    const f = financials.find((x) => x.year === year);
    const w = workforce.find((x) => x.year === year);
    return {
      year,
      revenue: f?.revenueEur ?? null,
      designFte: w?.designFte ?? null,
      staff: w?.totalStaff ?? null,
    };
  });
}
