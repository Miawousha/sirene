/**
 * Lightweight localStorage persistence for tabs, recent files, and auto-save.
 */

const PREFIX = "sirene:";

/* ── Generic helpers ─────────────────────────── */

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/* ── Tab state ───────────────────────────────── */

export interface TabData {
  id: string;
  title: string;
  filePath: string | null;
  code: string;
}

export function loadTabs(): { tabs: TabData[]; activeId: string | null } {
  return get("tabs", { tabs: [], activeId: null });
}

export function saveTabs(tabs: TabData[], activeId: string | null) {
  set("tabs", { tabs, activeId });
}

/* ── Recent files ────────────────────────────── */

const MAX_RECENT = 10;

export function loadRecentFiles(): string[] {
  return get<string[]>("recentFiles", []);
}

export function addRecentFile(filePath: string) {
  const recent = loadRecentFiles().filter((p) => p !== filePath);
  recent.unshift(filePath);
  if (recent.length > MAX_RECENT) recent.length = MAX_RECENT;
  set("recentFiles", recent);
}

export function clearRecentFiles() {
  set("recentFiles", []);
}
