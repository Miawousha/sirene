import { useState, useCallback } from "react";

interface UseFileOperationsParams {
  code: string;
  setCode: (code: string) => void;
  showToast: (msg: string) => void;
}

export function useFileOperations({
  code,
  setCode,
  showToast,
}: UseFileOperationsParams) {
  const [currentFile, setCurrentFile] = useState<string | null>(null);

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
        const content = await readTextFile(path as string);
        setCode(content);
        setCurrentFile(path as string);
        showToast("File opened");
      }
    } catch {
      showToast("Failed to open file");
    }
  }, [setCode, showToast]);

  const saveFile = useCallback(async () => {
    try {
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");

      if (currentFile) {
        await writeTextFile(currentFile, code);
        showToast("File saved");
      } else {
        // No file yet — do Save As
        const { save } = await import("@tauri-apps/plugin-dialog");
        const path = await save({
          filters: [{ name: "Mermaid", extensions: ["mmd"] }],
          defaultPath: "diagram.mmd",
        });
        if (path) {
          await writeTextFile(path, code);
          setCurrentFile(path);
          showToast("File saved");
        }
      }
    } catch {
      showToast("Failed to save file");
    }
  }, [code, currentFile, showToast]);

  const saveFileAs = useCallback(async () => {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");

      const path = await save({
        filters: [{ name: "Mermaid", extensions: ["mmd"] }],
        defaultPath: currentFile ?? "diagram.mmd",
      });
      if (path) {
        await writeTextFile(path, code);
        setCurrentFile(path);
        showToast("File saved");
      }
    } catch {
      showToast("Failed to save file");
    }
  }, [code, currentFile, showToast]);

  return { currentFile, openFile, saveFile, saveFileAs };
}
