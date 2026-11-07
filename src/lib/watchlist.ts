const KEY = "good-job.watchlist.v1";

export function loadWatchlist(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw) as string[];
    return new Set(list);
  } catch {
    return new Set();
  }
}

export function saveWatchlist(ids: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...ids]));
}

export function toggleWatchlist(productId: string): Set<string> {
  const current = loadWatchlist();
  if (current.has(productId)) current.delete(productId);
  else current.add(productId);
  saveWatchlist(current);
  return current;
}
