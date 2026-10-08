import type { HistoryEntry, CustomQuery } from "@/interface";
export const HISTORY_LIMIT = 50;
const STORAGE_KEY = "dev-toolbox:url-parser-history";

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const entries = parsed.filter(
      (e): e is HistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as HistoryEntry).url === "string" &&
        typeof (e as HistoryEntry).ts === "number",
    );
    return sortEntries(entries);
  } catch {
    return [];
  }
}

// pinned entries first (by pin time desc), then recent first
export function sortEntries(entries: HistoryEntry[]): HistoryEntry[] {
  return [...entries].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return b.ts - a.ts;
  });
}

export function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable (quota/private mode) — history stays in memory */
  }
}

// --- Custom Queries ---
const CUSTOM_QUERIES_KEY = "dev-toolbox:url-parser-custom-queries";

export function loadCustomQueries(): Array<CustomQuery> {
  try {
    const raw = localStorage.getItem(CUSTOM_QUERIES_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (q): q is CustomQuery =>
        typeof q === "object" &&
        q !== null &&
        typeof (q as CustomQuery).id === "string" &&
        typeof (q as CustomQuery).key === "string",
    ) as unknown as CustomQuery[];
  } catch {
    return [];
  }
}

export function saveCustomQueries(queries: unknown[]): void {
  try {
    localStorage.setItem(CUSTOM_QUERIES_KEY, JSON.stringify(queries));
  } catch {
    /* storage unavailable */
  }
}

export type { HistoryEntry } from "@/interface";
