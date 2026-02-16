import { useState, useCallback, useRef, useEffect } from "react";

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
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

  // Create a new file
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
        showToast("File created");
        return fullPath;
      } catch {
        showToast("Failed to create file");
        return null;
      }
    },
    [refresh, showToast]
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

  // Delete a file or folder
  const deleteEntry = useCallback(
    async (entryPath: string) => {
      try {
        const { remove } = await import("@tauri-apps/plugin-fs");
        await remove(entryPath, { recursive: true });
        await refresh();
        showToast("Deleted");
      } catch {
        showToast("Failed to delete");
      }
    },
    [refresh, showToast]
  );

  // Rename a file or folder
  const renameEntry = useCallback(
    async (oldPath: string, newName: string) => {
      const sep = oldPath.includes("/") ? "/" : "\\";
      const parts = oldPath.split(sep);
      parts.pop();
      const newPath = parts.join(sep) + sep + newName;
      try {
        const { rename } = await import("@tauri-apps/plugin-fs");
        await rename(oldPath, newPath);
        await refresh();
        showToast("Renamed");
        return newPath;
      } catch {
        showToast("Failed to rename");
        return null;
      }
    },
    [refresh, showToast]
  );

  // Auto-set root when no root is set but a file opens
  useEffect(() => {
    // This is called externally via setRootFromFile
  }, []);

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
  };
}
