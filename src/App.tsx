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

      const path = await save({
        filters: [{ name: "PNG", extensions: ["png"] }],
        defaultPath: "diagram.png",
      });
      if (!path) return;

      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob(async (pngBlob) => {
          if (pngBlob) {
            const arrayBuf = await pngBlob.arrayBuffer();
            await writeFile(path, new Uint8Array(arrayBuf));
            showToast("Exported PNG");
          }
        }, "image/png");
      };
      img.src = url;
    } catch {
      showToast("Export failed");
    }
  }, [showToast]);

  const handleCopyClipboard = useCallback(async () => {
    const svg = previewRef.current?.getSvg();
    if (!svg) return;
    try {
      const { writeText } = await import(
        "@tauri-apps/plugin-clipboard-manager"
      );
      await writeText(svg);
      showToast("SVG copied to clipboard");
    } catch {
      showToast("Copy failed");
    }
  }, [showToast]);

  const handleTemplateSelect = useCallback(
    (template: string) => {
      setActiveCode(template);
    },
    [setActiveCode]
  );

  // Copy PNG to clipboard (for pasting into Word/Google Docs)
  const handleCopyPng = useCallback(async () => {
    const svg = previewRef.current?.getSvg();
    if (!svg) return;

    try {
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob(async (pngBlob) => {
          if (pngBlob && navigator.clipboard && navigator.clipboard.write) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": pngBlob }),
              ]);
              showToast("PNG copied to clipboard");
            } catch {
              showToast("Clipboard write failed");
            }
          }
        }, "image/png");
      };
      img.src = url;
    } catch {
      showToast("Copy failed");
    }
  }, [showToast]);

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
      // Ctrl+W to close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        closeTab(activeId);
      }
      // Ctrl+C to copy diagram as PNG (only if no text is selected)
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        const selection = window.getSelection();
        const hasTextSelection = selection && selection.toString().length > 0;
        
        if (!hasTextSelection) {
          e.preventDefault();
          handleCopyPng();
        }
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
          onCopyClipboard={handleCopyClipboard}
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
