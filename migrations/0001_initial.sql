-- Companies and products
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  hq_country TEXT,
  description TEXT,
  review_status TEXT NOT NULL DEFAULT 'published',
  is_synthetic INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sector TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Observations (external facts + provenance)
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  unit TEXT,
  source_url TEXT,
  source_excerpt TEXT,
  retrieved_at TEXT,
  valid_at TEXT,
  period_start TEXT,
  period_end TEXT,
  value_type TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(entity_type, entity_id, field_key, valid_at, period_start)
);

CREATE INDEX IF NOT EXISTS idx_obs_entity ON observations(entity_type, entity_id);

-- Scores
CREATE TABLE IF NOT EXISTS score_snapshots (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  score_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  method_version TEXT NOT NULL,
  rationale TEXT,
  evidence_ids_json TEXT,
  assessed_at TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'published'
);

CREATE INDEX IF NOT EXISTS idx_scores_product ON score_snapshots(product_id, score_type);

-- UX issues
CREATE TABLE IF NOT EXISTS ux_issues (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  title TEXT NOT NULL,
  severity TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified',
  consequence TEXT,
  evidence_ids_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  title TEXT NOT NULL,
  seniority TEXT,
  salary_min REAL,
  salary_max REAL,
  salary_currency TEXT,
  salary_period TEXT,
  location TEXT,
  remote_policy TEXT,
  url TEXT,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  ats_id TEXT,
  UNIQUE(product_id, url)
);

-- Evidence assets
CREATE TABLE IF NOT EXISTS evidence_assets (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  workflow_name TEXT,
  capture_at TEXT,
  version_label TEXT,
  r2_key TEXT,
  thumb_r2_key TEXT,
  position_index INTEGER,
  position_total INTEGER,
  demo_status TEXT NOT NULL DEFAULT 'original',
  review_status TEXT NOT NULL DEFAULT 'published'
);

-- Reviews (customer / employee samples kept separate)
CREATE TABLE IF NOT EXISTS review_samples (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  platform TEXT,
  audience TEXT NOT NULL,
  rating REAL,
  rating_scale TEXT,
  review_count INTEGER,
  sample_size INTEGER,
  period_label TEXT,
  source_url TEXT,
  retrieved_at TEXT
);

CREATE TABLE IF NOT EXISTS review_themes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  audience TEXT NOT NULL,
  theme TEXT NOT NULL,
  share_pct REAL,
  sample_size INTEGER
);

-- Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  title TEXT NOT NULL,
  priority TEXT,
  affected_roles TEXT,
  affected_users_note TEXT,
  hypothesis TEXT,
  confidence TEXT,
  linked_issue_ids_json TEXT
);

-- Change log
CREATE TABLE IF NOT EXISTS change_log (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  changed_at TEXT NOT NULL,
  field_key TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT
);

-- Public collections
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  filter_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ingest runs (admin)
CREATE TABLE IF NOT EXISTS ingest_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  message TEXT,
  companies_touched INTEGER DEFAULT 0
);

-- Draft candidates (ingest)
CREATE TABLE IF NOT EXISTS ingest_candidates (
  id TEXT PRIMARY KEY,
  domain TEXT,
  name TEXT,
  source_url TEXT,
  review_status TEXT NOT NULL DEFAULT 'candidate',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
