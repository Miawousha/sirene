import { useState, useCallback } from "react";
import {
  FolderOpen,
  FolderClosed,
  FileText,
  Plus,
  FolderPlus,
  Trash2,
  Pencil,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  FolderSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { FileEntry } from "@/hooks/useFileTree";

interface FileTreeProps {
  rootPath: string | null;
  tree: FileEntry[];
  expandedDirs: Set<string>;
  activeFilePath: string | null;
  onToggleDir: (path: string) => void;
  onOpenFile: (path: string) => void;
  onPickFolder: () => void;
  onRefresh: () => void;
  onCreateFile: (dirPath: string, name: string) => Promise<string | null>;
  onCreateFolder: (dirPath: string, name: string) => Promise<void>;
  onDeleteEntry: (path: string) => Promise<void>;
  onRenameEntry: (oldPath: string, newName: string) => Promise<string | null>;
}

function InlineInput({
  defaultValue,
  placeholder,
  onSubmit,
  onCancel,
}: {
  defaultValue?: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && value.trim()) {
          onSubmit(value.trim());
        }
        if (e.key === "Escape") {
          onCancel();
        }
      }}
      onBlur={() => {
        if (value.trim()) {
          onSubmit(value.trim());
        } else {
          onCancel();
        }
      }}
      placeholder={placeholder}
      autoFocus
      className="ml-1 h-5 w-full rounded border border-input bg-background px-1 text-[11px] outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

function TreeEntry({
  entry,
  depth,
  expanded,
  activeFilePath,
  onToggleDir,
  onOpenFile,
  onCreateFile,
  onCreateFolder,
  onDeleteEntry,
  onRenameEntry,
}: {
  entry: FileEntry;
  depth: number;
  expanded: boolean;
  activeFilePath: string | null;
  onToggleDir: (path: string) => void;
  onOpenFile: (path: string) => void;
  onCreateFile: (dirPath: string, name: string) => Promise<string | null>;
  onCreateFolder: (dirPath: string, name: string) => Promise<void>;
  onDeleteEntry: (path: string) => Promise<void>;
  onRenameEntry: (oldPath: string, newName: string) => Promise<string | null>;
}) {
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const isActive = !entry.isDirectory && entry.path === activeFilePath;

  const handleClick = useCallback(() => {
    if (entry.isDirectory) {
      onToggleDir(entry.path);
    } else {
      onOpenFile(entry.path);
    }
  }, [entry, onToggleDir, onOpenFile]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRenaming(true);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onDeleteEntry(entry.path);
      }
      if (e.key === "F2") {
        e.preventDefault();
        setRenaming(true);
      }
    },
    [entry.path, onDeleteEntry]
  );

  const handleCreateFile = useCallback(
    async (name: string) => {
      const finalName = name.endsWith(".mmd") || name.endsWith(".mermaid") ? name : name + ".mmd";
      const created = await onCreateFile(entry.path, finalName);
      setCreating(null);
      if (created) onOpenFile(created);
    },
    [entry.path, onCreateFile, onOpenFile]
  );

  const handleCreateFolder = useCallback(
    async (name: string) => {
      await onCreateFolder(entry.path, name);
      setCreating(null);
    },
    [entry.path, onCreateFolder]
  );

  const handleRename = useCallback(
    async (newName: string) => {
      await onRenameEntry(entry.path, newName);
      setRenaming(false);
    },
    [entry.path, onRenameEntry]
  );

  return (
    <>
      {/* Row — left-click opens, double-click renames, right-click shows menu */}
      <div
        className={cn(
          "group flex h-6 cursor-pointer items-center gap-1 rounded-sm px-1 text-[11px] outline-none hover:bg-muted/80 focus:bg-muted/80",
          isActive && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        tabIndex={0}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
      >
        {entry.isDirectory ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            {expanded ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            ) : (
              <FolderClosed className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400" />
          </>
        )}
        {renaming ? (
          <InlineInput
            defaultValue={entry.name}
            placeholder="New name"
            onSubmit={handleRename}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span className="truncate">{entry.name}</span>
        )}
      </div>

      {/* Right-click context menu */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <span
            className="fixed h-0 w-0"
            style={{ left: menuPos.x, top: menuPos.y }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {entry.isDirectory && (
            <>
              <DropdownMenuItem onClick={() => setCreating("file")}>
                <Plus className="h-3.5 w-3.5" />
                New file
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreating("folder")}>
                <FolderPlus className="h-3.5 w-3.5" />
                New folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => setRenaming(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Rename
            <DropdownMenuShortcut>F2</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDeleteEntry(entry.path)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
            <DropdownMenuShortcut>Del</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Inline create input */}
      {creating && expanded && (
        <div
          className="flex h-6 items-center gap-1 px-1"
          style={{ paddingLeft: `${(depth + 1) * 14 + 4}px` }}
        >
          <span className="w-3" />
          {creating === "file" ? (
            <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400" />
          ) : (
            <FolderClosed className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          )}
          <InlineInput
            placeholder={creating === "file" ? "filename.mmd" : "folder name"}
            onSubmit={creating === "file" ? handleCreateFile : handleCreateFolder}
            onCancel={() => setCreating(null)}
          />
        </div>
      )}

      {/* Children */}
      {entry.isDirectory && expanded && entry.children && (
        <TreeEntries
          entries={entry.children}
          depth={depth + 1}
          expandedDirs={new Set()}
          activeFilePath={activeFilePath}
          onToggleDir={onToggleDir}
          onOpenFile={onOpenFile}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onDeleteEntry={onDeleteEntry}
          onRenameEntry={onRenameEntry}
          allExpanded={undefined}
        />
      )}
    </>
  );
}

function TreeEntries({
  entries,
  depth,
  activeFilePath,
  onToggleDir,
  onOpenFile,
  onCreateFile,
  onCreateFolder,
  onDeleteEntry,
  onRenameEntry,
  allExpanded,
}: {
  entries: FileEntry[];
  depth: number;
  expandedDirs: Set<string>;
  activeFilePath: string | null;
  onToggleDir: (path: string) => void;
  onOpenFile: (path: string) => void;
  onCreateFile: (dirPath: string, name: string) => Promise<string | null>;
  onCreateFolder: (dirPath: string, name: string) => Promise<void>;
  onDeleteEntry: (path: string) => Promise<void>;
  onRenameEntry: (oldPath: string, newName: string) => Promise<string | null>;
  allExpanded: Set<string> | undefined;
}) {
  return (
    <>
      {entries.map((entry) => (
        <TreeEntry
          key={entry.path}
          entry={entry}
          depth={depth}
          expanded={allExpanded ? allExpanded.has(entry.path) : false}
          activeFilePath={activeFilePath}
          onToggleDir={onToggleDir}
          onOpenFile={onOpenFile}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onDeleteEntry={onDeleteEntry}
          onRenameEntry={onRenameEntry}
        />
      ))}
    </>
  );
}

export function FileTree({
  rootPath,
  tree,
  expandedDirs,
  activeFilePath,
  onToggleDir,
  onOpenFile,
  onPickFolder,
  onRefresh,
  onCreateFile,
  onCreateFolder,
  onDeleteEntry,
  onRenameEntry,
}: FileTreeProps) {
  const [creatingAtRoot, setCreatingAtRoot] = useState<"file" | "folder" | null>(null);

  const rootName = rootPath
    ? rootPath.split(/[\\/]/).filter(Boolean).pop() ?? rootPath
    : null;

  if (!rootPath) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex h-8 items-center gap-1.5 border-b bg-muted/50 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <FolderSearch className="h-3.5 w-3.5" />
          Explorer
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
          <FolderSearch className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            Open a folder to browse your diagrams
          </p>
          <Button variant="outline" size="sm" onClick={onPickFolder}>
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            Open Folder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-8 items-center gap-1 border-b bg-muted/50 px-2">
        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex-1 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {rootName}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-5 w-5"
              onClick={() => setCreatingAtRoot("file")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New file</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-5 w-5"
              onClick={() => setCreatingAtRoot("folder")}
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New folder</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-5 w-5"
              onClick={onRefresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-5 w-5"
              onClick={onPickFolder}
            >
              <FolderSearch className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Change folder</TooltipContent>
        </Tooltip>
      </div>

      {/* Tree */}
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {/* Root-level create input */}
        {creatingAtRoot && (
          <div className="flex h-6 items-center gap-1 px-1" style={{ paddingLeft: "4px" }}>
            <span className="w-3" />
            {creatingAtRoot === "file" ? (
              <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            ) : (
              <FolderClosed className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
            <InlineInput
              placeholder={creatingAtRoot === "file" ? "filename.mmd" : "folder name"}
              onSubmit={async (name) => {
                if (creatingAtRoot === "file") {
                  const finalName = name.endsWith(".mmd") || name.endsWith(".mermaid") ? name : name + ".mmd";
                  const created = await onCreateFile(rootPath, finalName);
                  if (created) onOpenFile(created);
                } else {
                  await onCreateFolder(rootPath, name);
                }
                setCreatingAtRoot(null);
              }}
              onCancel={() => setCreatingAtRoot(null)}
            />
          </div>
        )}

        {tree.length === 0 && !creatingAtRoot ? (
          <p className="px-3 py-4 text-center text-[11px] text-muted-foreground">
            No .mmd files found
          </p>
        ) : (
          tree.map((entry) => (
            <TreeEntry
              key={entry.path}
              entry={entry}
              depth={0}
              expanded={expandedDirs.has(entry.path)}
              activeFilePath={activeFilePath}
              onToggleDir={onToggleDir}
              onOpenFile={onOpenFile}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDeleteEntry={onDeleteEntry}
              onRenameEntry={onRenameEntry}
            />
          ))
        )}
      </div>
    </div>
  );
}
