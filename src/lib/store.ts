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

/* ── Diagram style preferences ───────────────── */

export type MermaidTheme = "default" | "dark" | "forest" | "neutral" | "base";

export interface DiagramPreferences {
  lightTheme: MermaidTheme;
  darkTheme: MermaidTheme;
  fontFamily: string;
  customCss: string;
}

export const DEFAULT_PREFERENCES: DiagramPreferences = {
  lightTheme: "default",
  darkTheme: "dark",
  fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  customCss: "",
};

export function loadPreferences(): DiagramPreferences {
  return { ...DEFAULT_PREFERENCES, ...get<Partial<DiagramPreferences>>("preferences", {}) };
}

export function savePreferences(prefs: DiagramPreferences) {
  set("preferences", prefs);
}
