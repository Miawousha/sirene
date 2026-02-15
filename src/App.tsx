import { useState, useCallback, useRef, useEffect } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toolbar } from "@/components/Toolbar";
import { TabBar } from "@/components/TabBar";
import { Editor } from "@/components/Editor";
import { Preview, type PreviewHandle } from "@/components/Preview";
import { StatusBar } from "@/components/StatusBar";
import { useTheme } from "@/hooks/useTheme";
import { useTabs } from "@/hooks/useTabs";
import { loadRecentFiles, clearRecentFiles } from "@/lib/store";

export default function App() {
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>(loadRecentFiles);
  const { theme, toggleTheme } = useTheme();
  const previewRef = useRef<PreviewHandle>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const {
    tabs,
    activeTab,
    activeId,
    selectTab,
    addTab,
    closeTab,
    setActiveCode,
    openFile: doOpenFile,
    openRecentFile: doOpenRecent,
    saveFile,
    saveFileAs,
  } = useTabs({ showToast });

  // Refresh recent files list whenever a file op happens
  const refreshRecent = useCallback(() => {
    setRecentFiles(loadRecentFiles());
  }, []);

  const openFile = useCallback(async () => {
    await doOpenFile();
    refreshRecent();
  }, [doOpenFile, refreshRecent]);

  const openRecentFile = useCallback(
    async (filePath: string) => {
      await doOpenRecent(filePath);
      refreshRecent();
    },
    [doOpenRecent, refreshRecent]
  );

  const handleSave = useCallback(async () => {
    await saveFile();
    refreshRecent();
  }, [saveFile, refreshRecent]);

  const handleSaveAs = useCallback(async () => {
    await saveFileAs();
    refreshRecent();
  }, [saveFileAs, refreshRecent]);

  const handleClearRecent = useCallback(() => {
    clearRecentFiles();
    setRecentFiles([]);
  }, []);

  const handleNewTab = useCallback(() => {
    addTab();
  }, [addTab]);

  const handleExportSvg = useCallback(async () => {
    const svg = previewRef.current?.getSvg();
    if (!svg) return;
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const path = await save({
        filters: [{ name: "SVG", extensions: ["svg"] }],
        defaultPath: "diagram.svg",
      });
      if (path) {
        await writeTextFile(path, svg);
        showToast("Exported SVG");
      }
    } catch {
      showToast("Export failed");
    }
  }, [showToast]);

  const handleExportPng = useCallback(async () => {
    const svg = previewRef.current?.getSvg();
    if (!svg) return;
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeFile } = await import("@tauri-apps/plugin-fs");
      const { svgToPngBytes } = await import("@/lib/clipboard");

      const path = await save({
        filters: [{ name: "PNG", extensions: ["png"] }],
        defaultPath: "diagram.png",
      });
      if (!path) return;

      const pngBytes = await svgToPngBytes(svg);
      await writeFile(path, pngBytes);
      showToast("Exported PNG");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Export PNG failed:", err);
      showToast(`Export failed: ${msg}`);
    }
  }, [showToast]);

  const handleCopySvg = useCallback(async () => {
    const svg = previewRef.current?.getSvg();
    if (!svg) return;
    try {
      const { copySvgToClipboard } = await import("@/lib/clipboard");
      await copySvgToClipboard(svg);
      showToast("SVG copied to clipboard");
    } catch {
      showToast("Copy failed");
    }
  }, [showToast]);

  const handleCopyPng = useCallback(async () => {
    const svg = previewRef.current?.getSvg();
    if (!svg) {
      showToast("No diagram to copy");
      return;
    }
    try {
      const { copyPngToClipboard } = await import("@/lib/clipboard");
      await copyPngToClipboard(svg);
      showToast("PNG copied to clipboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Copy PNG failed:", err);
      showToast(`Copy failed: ${msg}`);
    }
  }, [showToast]);

  const handleTemplateSelect = useCallback(
    (template: string) => {
      setActiveCode(template);
    },
    [setActiveCode]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        openFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl/Cmd+W to close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        closeTab(activeId);
      }
      // Ctrl/Cmd+C to copy diagram as PNG when editor is NOT focused
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        // Check if the focus is inside the CodeMirror editor
        const active = document.activeElement;
        const isInEditor = active?.closest(".cm-editor") != null;

        if (!isInEditor) {
          e.preventDefault();
          handleCopyPng();
        }
        // Otherwise, let CodeMirror handle the normal text copy
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, handleSaveAs, openFile, handleNewTab, closeTab, activeId, handleCopyPng]);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={`flex h-screen w-screen flex-col overflow-hidden ${theme === "dark" ? "dark" : ""}`}
      >
        <Toolbar
          theme={theme}
          recentFiles={recentFiles}
          onToggleTheme={toggleTheme}
          onOpen={openFile}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onExportSvg={handleExportSvg}
          onExportPng={handleExportPng}
          onCopySvg={handleCopySvg}
          onCopyPng={handleCopyPng}
          onTemplateSelect={handleTemplateSelect}
          onOpenRecent={openRecentFile}
          onClearRecent={handleClearRecent}
        />
        <TabBar
          tabs={tabs}
          activeId={activeId}
          onSelect={selectTab}
          onClose={closeTab}
          onNew={handleNewTab}
        />
        <div className="min-h-0 flex-1">
          <Allotment defaultSizes={[400, 600]} className="split-container">
            <Allotment.Pane minSize={250}>
              <Editor
                code={activeTab?.code ?? ""}
                onChange={setActiveCode}
                theme={theme}
              />
            </Allotment.Pane>
            <Allotment.Pane minSize={300}>
              <Preview
                ref={previewRef}
                code={activeTab?.code ?? ""}
                theme={theme}
                onError={setError}
              />
            </Allotment.Pane>
          </Allotment>
        </div>
        <StatusBar
          error={error}
          currentFile={activeTab?.filePath ?? null}
        />

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-9 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 rounded-md bg-foreground px-4 py-2 text-xs text-background shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
