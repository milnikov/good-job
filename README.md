# Good Job

European product research catalog for designers — public, login-free, hosted on **Cloudflare Free** (Workers, D1, R2).

## Stack

- **UI:** React + Vite, cassette-futurism terminal styling ([brief](ref/Cassette_Futurism_UI_Brief.pdf))
- **API:** Cloudflare Worker (`/api/*`)
- **Data:** D1 (published facts), R2 (evidence images), static `public/data/screener-index.json`

## Local development

```bash
npm install
npm run db:migrate:local
npm run seed:local
npm run dev
```

Open the URL from the terminal (Vite + Worker). Screener reads `/data/screener-index.json`; dossier uses `/api/products/:slug`.

## Commands

| Script | Purpose |
|--------|---------|
| `npm run build` | Production build + screener index |
| `npm run deploy` | Build + `wrangler deploy` |
| `npm run seed:local` | Reset demo seed in local D1 |
| `npm run ingest -- discover --domain … --name …` | Queue candidate |
| `npm run ingest -- publish --product-id …` | Editorial publish gate |
| `npm run ingest -- daily` | Rebuild index (cron) |

## GitHub

Public repo [milnikov/good-job](https://github.com/milnikov/good-job). Actions need:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Create D1 + R2 once, then set real `database_id` in `wrangler.jsonc`:

```bash
npx wrangler d1 create good-job-db
npx wrangler r2 bucket create good-job-evidence
```

## Docs

- Product PRD: `Product_PRD.docx` (also commit in repo)
- Visual reference: `ref/`
