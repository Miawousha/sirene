import { useState, useCallback, useRef } from "react";

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

interface UndoAction {
  label: string;
  execute: () => Promise<void>;
}

interface UseFileTreeParams {
  showToast: (msg: string) => void;
}

const MERMAID_EXTENSIONS = [".mmd", ".mermaid"];

function isMermaidFile(name: string): boolean {
  return MERMAID_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
}

async function readDirectory(dirPath: string): Promise<FileEntry[]> {
  const { readDir } = await import("@tauri-apps/plugin-fs");
  const entries = await readDir(dirPath);

  const result: FileEntry[] = [];

  for (const entry of entries) {
    // Skip hidden files/dirs
    if (entry.name.startsWith(".")) continue;

    const fullPath = dirPath.replace(/[\\/]$/, "") + "\\" + entry.name;

    if (entry.isDirectory) {
      result.push({
        name: entry.name,
        path: fullPath,
        isDirectory: true,
        children: undefined, // loaded lazily
      });
    } else if (isMermaidFile(entry.name)) {
      result.push({
        name: entry.name,
        path: fullPath,
        isDirectory: false,
      });
    }
  }

  // Sort: folders first, then files, alphabetically
  result.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

export type { FileEntry };

export function useFileTree({ showToast }: UseFileTreeParams) {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [tree, setTree] = useState<FileEntry[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const undoStackRef = useRef<UndoAction[]>([]);

  const pushUndo = useCallback((action: UndoAction) => {
    undoStackRef.current.push(action);
    // Cap the stack at 50 entries
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
  }, []);

  // Load root directory
  const loadRoot = useCallback(async (dirPath: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const entries = await readDirectory(dirPath);
      setTree(entries);
      setRootPath(dirPath);
      setExpandedDirs(new Set());
    } catch {
      setTree([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Set root from a file path (use its parent dir)
  const setRootFromFile = useCallback(
    (filePath: string) => {
      // Extract parent directory
      const sep = filePath.includes("/") ? "/" : "\\";
      const parts = filePath.split(sep);
      parts.pop();
      const dir = parts.join(sep);
      if (dir && dir !== rootPath) {
        loadRoot(dir);
      }
    },
    [rootPath, loadRoot]
  );

  // Open folder picker
  const pickFolder = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const path = await open({ directory: true, multiple: false });
      if (path) {
        loadRoot(path as string);
      }
    } catch {
      showToast("Failed to open folder");
    }
  }, [loadRoot, showToast]);

  // Toggle expand a directory
  const toggleDir = useCallback(
    async (dirPath: string) => {
      const newExpanded = new Set(expandedDirs);
      if (newExpanded.has(dirPath)) {
        newExpanded.delete(dirPath);
        setExpandedDirs(newExpanded);
      } else {
        newExpanded.add(dirPath);
        setExpandedDirs(newExpanded);

        // Load children lazily
        const loadChildren = async (entries: FileEntry[]): Promise<FileEntry[]> => {
          return Promise.all(
            entries.map(async (entry) => {
              if (entry.path === dirPath && entry.isDirectory && !entry.children) {
                const children = await readDirectory(entry.path);
                return { ...entry, children };
              }
              if (entry.children) {
                return { ...entry, children: await loadChildren(entry.children) };
              }
              return entry;
            })
          );
        };

        try {
          const updated = await loadChildren(tree);
          setTree(updated);
        } catch {
          // ignore
        }
      }
    },
    [expandedDirs, tree]
  );

  // Refresh the tree
  const refresh = useCallback(async () => {
    if (!rootPath) return;

    // Reload the root
    try {
      const entries = await readDirectory(rootPath);
      // Also reload any expanded subdirectories
      const reloadExpanded = async (
        entries: FileEntry[],
        expanded: Set<string>
      ): Promise<FileEntry[]> => {
        return Promise.all(
          entries.map(async (entry) => {
            if (entry.isDirectory && expanded.has(entry.path)) {
              try {
                const children = await readDirectory(entry.path);
                return {
                  ...entry,
                  children: await reloadExpanded(children, expanded),
                };
              } catch {
                return { ...entry, children: [] };
              }
            }
            return entry;
          })
        );
      };

      const refreshed = await reloadExpanded(entries, expandedDirs);
      setTree(refreshed);
    } catch {
      // ignore
    }
  }, [rootPath, expandedDirs]);

  // Create a new file (with undo support)
  const createFile = useCallback(
    async (dirPath: string, fileName: string) => {
      const fullPath = dirPath.replace(/[\\/]$/, "") + "\\" + fileName;
      try {
        const { exists, writeTextFile } = await import("@tauri-apps/plugin-fs");
        if (await exists(fullPath)) {
          showToast("File already exists");
          return null;
        }
        await writeTextFile(fullPath, "flowchart TD\n    A[Start] --> B[End]\n");
        await refresh();

        pushUndo({
          label: `Create ${fileName}`,
          execute: async () => {
            const { remove } = await import("@tauri-apps/plugin-fs");
            await remove(fullPath);
            await refresh();
          },
        });

        showToast("File created");
        return fullPath;
      } catch {
        showToast("Failed to create file");
        return null;
      }
    },
    [refresh, showToast, pushUndo]
  );

  // Create a new folder
  const createFolder = useCallback(
    async (dirPath: string, folderName: string) => {
      const fullPath = dirPath.replace(/[\\/]$/, "") + "\\" + folderName;
      try {
        const { exists, mkdir } = await import("@tauri-apps/plugin-fs");
        if (await exists(fullPath)) {
          showToast("Folder already exists");
          return;
        }
        await mkdir(fullPath);
        await refresh();
        showToast("Folder created");
      } catch {
        showToast("Failed to create folder");
      }
    },
    [refresh, showToast]
  );

  // Delete a file or folder (with undo support)
  const deleteEntry = useCallback(
    async (entryPath: string) => {
      try {
        const { remove, readTextFile } = await import("@tauri-apps/plugin-fs");

        // Try to save file content for undo (only works for single files)
        let savedContent: string | null = null;
        const fileName = entryPath.split(/[\\/]/).pop() ?? entryPath;
        try {
          savedContent = await readTextFile(entryPath);
        } catch {
          // It's a folder or unreadable — undo won't restore content
        }

        await remove(entryPath, { recursive: true });
        await refresh();

        // Push undo action
        if (savedContent !== null) {
          pushUndo({
            label: `Delete ${fileName}`,
            execute: async () => {
              const { writeTextFile } = await import("@tauri-apps/plugin-fs");
              await writeTextFile(entryPath, savedContent);
              await refresh();
            },
          });
        }

        showToast("Deleted — Ctrl+Z to undo");
      } catch {
        showToast("Failed to delete");
      }
    },
    [refresh, showToast, pushUndo]
  );

  // Rename a file or folder (with undo support)
  const renameEntry = useCallback(
    async (oldPath: string, newName: string) => {
      const sep = oldPath.includes("/") ? "/" : "\\";
      const parts = oldPath.split(sep);
      const oldName = parts.pop()!;
      const newPath = parts.join(sep) + sep + newName;
      try {
        const { rename } = await import("@tauri-apps/plugin-fs");
        await rename(oldPath, newPath);
        await refresh();

        pushUndo({
          label: `Rename ${oldName} → ${newName}`,
          execute: async () => {
            const { rename: doRename } = await import("@tauri-apps/plugin-fs");
            await doRename(newPath, oldPath);
            await refresh();
          },
        });

        showToast("Renamed — Ctrl+Z to undo");
        return newPath;
      } catch {
        showToast("Failed to rename");
        return null;
      }
    },
    [refresh, showToast, pushUndo]
  );

  // Undo the last file operation
  const undo = useCallback(async () => {
    const action = undoStackRef.current.pop();
    if (!action) {
      showToast("Nothing to undo");
      return;
    }
    try {
      await action.execute();
      showToast(`Undone: ${action.label}`);
    } catch {
      showToast("Undo failed");
    }
  }, [showToast]);

  return {
    rootPath,
    tree,
    expandedDirs,
    loading,
    loadRoot,
    setRootFromFile,
    pickFolder,
    toggleDir,
    refresh,
    createFile,
    createFolder,
    deleteEntry,
    renameEntry,
    undo,
  };
}
