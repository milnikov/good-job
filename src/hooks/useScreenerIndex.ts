import { useEffect, useState } from "react";
import type { ScreenerIndex } from "@shared/types";

export function useScreenerIndex() {
  const [data, setData] = useState<ScreenerIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/screener-index.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ScreenerIndex;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, loading: !data && !error };
}
