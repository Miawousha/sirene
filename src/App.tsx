import { useState, useCallback, useRef, useEffect } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toolbar } from "@/components/Toolbar";
import { Editor } from "@/components/Editor";
import { Preview, type PreviewHandle } from "@/components/Preview";
import { StatusBar } from "@/components/StatusBar";
import { useTheme } from "@/hooks/useTheme";
import { useFileOperations } from "@/hooks/useFileOperations";
import { TEMPLATES } from "@/lib/templates";

const DEFAULT_CODE = TEMPLATES.flowchart;

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const previewRef = useRef<PreviewHandle>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const { currentFile, openFile, saveFile, saveFileAs } = useFileOperations({
    code,
    setCode,
    showToast,
  });

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

  const handleTemplateSelect = useCallback((template: string) => {
    setCode(template);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          saveFileAs();
        } else {
          saveFile();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        openFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveFile, saveFileAs, openFile]);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={`flex h-screen w-screen flex-col overflow-hidden ${theme === "dark" ? "dark" : ""}`}
      >
        <Toolbar
          currentFile={currentFile}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpen={openFile}
          onSave={saveFile}
          onSaveAs={saveFileAs}
          onExportSvg={handleExportSvg}
          onExportPng={handleExportPng}
          onCopyClipboard={handleCopyClipboard}
          onTemplateSelect={handleTemplateSelect}
        />
        <div className="min-h-0 flex-1">
          <Allotment defaultSizes={[400, 600]} className="split-container">
            <Allotment.Pane minSize={250}>
              <Editor code={code} onChange={setCode} theme={theme} />
            </Allotment.Pane>
            <Allotment.Pane minSize={300}>
              <Preview
                ref={previewRef}
                code={code}
                theme={theme}
                onError={setError}
              />
            </Allotment.Pane>
          </Allotment>
        </div>
        <StatusBar error={error} currentFile={currentFile} />

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
