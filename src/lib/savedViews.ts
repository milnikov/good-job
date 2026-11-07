import type { SavedViewState } from "@shared/types";

const KEY = "good-job.savedViews.v1";

export type NamedView = { id: string; name: string; view: SavedViewState };

export function loadSavedViews(): NamedView[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NamedView[];
  } catch {
    return [];
  }
}

export function saveNamedView(name: string, view: SavedViewState): NamedView[] {
  const list = loadSavedViews();
  const entry: NamedView = {
    id: crypto.randomUUID(),
    name,
    view,
  };
  const next = [entry, ...list].slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
