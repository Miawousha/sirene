import { useState, useCallback, useRef, useEffect } from "react";
import {
  type TabData,
  loadTabs,
  saveTabs,
  addRecentFile,
} from "@/lib/store";
import { TEMPLATES } from "@/lib/templates";

let nextId = 1;

function makeId() {
  return `tab-${Date.now()}-${nextId++}`;
}

function newTab(code?: string, filePath?: string | null, title?: string): TabData {
  return {
    id: makeId(),
    title: title ?? "Untitled",
    filePath: filePath ?? null,
    code: code ?? TEMPLATES.flowchart,
  };
}

function fileNameFrom(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

interface UseTabsParams {
  showToast: (msg: string) => void;
}

export function useTabs({ showToast }: UseTabsParams) {
  // ── Initialize from localStorage or default ─────────
  const [tabs, setTabs] = useState<TabData[]>(() => {
    const saved = loadTabs();
    if (saved.tabs.length > 0) return saved.tabs;
    return [newTab()];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const saved = loadTabs();
    if (saved.activeId && saved.tabs.some((t) => t.id === saved.activeId)) {
      return saved.activeId;
    }
    return tabs[0]?.id ?? "";
  });

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  // ── Auto-save to localStorage on every change ───────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTabs(tabs, activeId);
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [tabs, activeId]);

  // ── Tab CRUD ────────────────────────────────────────

  const updateTab = useCallback(
    (id: string, patch: Partial<TabData>) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
    },
    []
  );

  const setActiveCode = useCallback(
    (code: string) => {
      updateTab(activeId, { code });
    },
    [activeId, updateTab]
  );

  const addTab = useCallback(
    (code?: string, filePath?: string | null, title?: string) => {
      const tab = newTab(code, filePath, title);
      setTabs((prev) => [...prev, tab]);
      setActiveId(tab.id);
      return tab.id;
    },
    []
  );

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        const next = prev.filter((t) => t.id !== id);

        // If closing the active tab, activate an adjacent one
        if (id === activeId && next.length > 0) {
          const newIdx = Math.min(idx, next.length - 1);
          setActiveId(next[newIdx].id);
        }

        // Never leave zero tabs — create a default one
        if (next.length === 0) {
          const fresh = newTab();
          setActiveId(fresh.id);
          return [fresh];
        }

        return next;
      });
    },
    [activeId]
  );

  const selectTab = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  // ── File operations ─────────────────────────────────

  const openFile = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readTextFile } = await import("@tauri-apps/plugin-fs");

      const path = await open({
        filters: [
          { name: "Mermaid", extensions: ["mmd", "mermaid"] },
          { name: "All Files", extensions: ["*"] },
        ],
        multiple: false,
      });

      if (path) {
        const pathStr = path as string;

        // Check if file is already open in a tab
        const existing = tabs.find((t) => t.filePath === pathStr);
        if (existing) {
          setActiveId(existing.id);
          showToast("File already open");
          return;
        }

        const content = await readTextFile(pathStr);
        addRecentFile(pathStr);

        // If the current tab is untitled and unmodified, reuse it
        if (
          activeTab &&
          !activeTab.filePath &&
          activeTab.code === TEMPLATES.flowchart
        ) {
          updateTab(activeTab.id, {
            code: content,
            filePath: pathStr,
            title: fileNameFrom(pathStr),
          });
        } else {
          addTab(content, pathStr, fileNameFrom(pathStr));
        }

        showToast("File opened");
      }
    } catch {
      showToast("Failed to open file");
    }
  }, [tabs, activeTab, addTab, updateTab, showToast]);

  const openRecentFile = useCallback(
    async (filePath: string) => {
      try {
        const { readTextFile } = await import("@tauri-apps/plugin-fs");

        // Check if already open
        const existing = tabs.find((t) => t.filePath === filePath);
        if (existing) {
          setActiveId(existing.id);
          return;
        }

        const content = await readTextFile(filePath);
        addRecentFile(filePath);

        if (
          activeTab &&
          !activeTab.filePath &&
          activeTab.code === TEMPLATES.flowchart
        ) {
          updateTab(activeTab.id, {
            code: content,
            filePath,
            title: fileNameFrom(filePath),
          });
        } else {
          addTab(content, filePath, fileNameFrom(filePath));
        }

        showToast("File opened");
      } catch {
        showToast("Failed to open file — it may have been moved or deleted");
      }
    },
    [tabs, activeTab, addTab, updateTab, showToast]
  );

  const saveFile = useCallback(async () => {
    if (!activeTab) return;
    try {
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");

      if (activeTab.filePath) {
        await writeTextFile(activeTab.filePath, activeTab.code);
        showToast("File saved");
      } else {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const path = await save({
          filters: [{ name: "Mermaid", extensions: ["mmd"] }],
          defaultPath: "diagram.mmd",
        });
        if (path) {
          await writeTextFile(path, activeTab.code);
          updateTab(activeTab.id, {
            filePath: path,
            title: fileNameFrom(path),
          });
          addRecentFile(path);
          showToast("File saved");
        }
      }
    } catch {
      showToast("Failed to save file");
    }
  }, [activeTab, updateTab, showToast]);

  const saveFileAs = useCallback(async () => {
    if (!activeTab) return;
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");

      const path = await save({
        filters: [{ name: "Mermaid", extensions: ["mmd"] }],
        defaultPath: activeTab.filePath ?? "diagram.mmd",
      });
      if (path) {
        await writeTextFile(path, activeTab.code);
        updateTab(activeTab.id, {
          filePath: path,
          title: fileNameFrom(path),
        });
        addRecentFile(path);
        showToast("File saved");
      }
    } catch {
      showToast("Failed to save file");
    }
  }, [activeTab, updateTab, showToast]);

  return {
    tabs,
    activeTab,
    activeId,
    selectTab,
    addTab,
    closeTab,
    setActiveCode,
    openFile,
    openRecentFile,
    saveFile,
    saveFileAs,
  };
}
