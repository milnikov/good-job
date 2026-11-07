import { getDossier } from "./dossier";
import { getEvidenceObject } from "./r2";

export interface Env {
  DB: D1Database;
  EVIDENCE: R2Bucket;
  APP_DISPLAY_NAME: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, name: env.APP_DISPLAY_NAME });
    }

    const dossierMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
    if (dossierMatch && request.method === "GET") {
      const slugOrId = decodeURIComponent(dossierMatch[1]);
      const dossier = await getDossier(env.DB, slugOrId);
      if (!dossier) {
        return json({ error: "not_found" }, 404);
      }
      return json(dossier);
    }

    const evidenceMatch = url.pathname.match(/^\/api\/evidence\/(.+)$/);
    if (evidenceMatch && request.method === "GET") {
      const key = decodeURIComponent(evidenceMatch[1]);
      const obj = await getEvidenceObject(env.EVIDENCE, key);
      if (!obj) {
        return new Response("Not found", { status: 404 });
      }
      const headers = new Headers();
      if (obj.httpMetadata?.contentType) {
        headers.set("content-type", obj.httpMetadata.contentType);
      }
      headers.set("cache-control", "public, max-age=86400");
      return new Response(obj.body, { headers });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
}
