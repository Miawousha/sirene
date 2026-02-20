import {
  FolderOpen,
  Save,
  Download,
  Image,
  ClipboardCopy,
  Sun,
  Moon,
  FileCode,
  FilePlus,
  Clock,
  Trash2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { TEMPLATES } from "@/lib/templates";
import { modKey } from "@/lib/platform";

interface ToolbarProps {
  theme: "light" | "dark";
  recentFiles: string[];
  onToggleTheme: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onCopySvg: () => void;
  onCopyPng: () => void;
  onTemplateSelect: (template: string) => void;
  onOpenRecent: (filePath: string) => void;
  onClearRecent: () => void;
  onOpenPreferences: () => void;
}

const TEMPLATE_LABELS: Record<string, string> = {
  flowchart: "Flowchart",
  sequence: "Sequence Diagram",
  classDiagram: "Class Diagram",
  stateDiagram: "State Diagram",
  erDiagram: "ER Diagram",
  gantt: "Gantt Chart",
  pie: "Pie Chart",
  gitGraph: "Git Graph",
};

function ToolbarButton({
  tooltip,
  shortcut,
  onClick,
  children,
}: {
  tooltip: string;
  shortcut?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {tooltip}
          {shortcut && (
            <span className="ml-2 text-muted-foreground">{shortcut}</span>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

export function Toolbar({
  theme,
  recentFiles,
  onToggleTheme,
  onOpen,
  onSave,
  onSaveAs,
  onExportSvg,
  onExportPng,
  onCopySvg,
  onCopyPng,
  onTemplateSelect,
  onOpenRecent,
  onClearRecent,
  onOpenPreferences,
}: ToolbarProps) {
  return (
    <div className="flex h-11 items-center gap-1 border-b bg-background px-3 select-none">
      {/* Logo / Title */}
      <span className="mr-2 text-sm font-bold tracking-tight text-primary">
        Sirene
      </span>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* File operations */}
      <ToolbarButton tooltip="Open file" shortcut={`${modKey}+O`} onClick={onOpen}>
        <FolderOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Open</span>
      </ToolbarButton>

      <ToolbarButton tooltip="Save" shortcut={`${modKey}+S`} onClick={onSave}>
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">Save</span>
      </ToolbarButton>

      <ToolbarButton
        tooltip="Save As"
        shortcut={`${modKey}+Shift+S`}
        onClick={onSaveAs}
      >
        <FilePlus className="h-4 w-4" />
      </ToolbarButton>

      {/* Recent files */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Recent</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Recently opened files</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>Recent Files</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {recentFiles.length === 0 ? (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">No recent files</span>
            </DropdownMenuItem>
          ) : (
            <>
              {recentFiles.map((filePath) => (
                <DropdownMenuItem
                  key={filePath}
                  onClick={() => onOpenRecent(filePath)}
                  className="flex flex-col items-start gap-0"
                >
                  <span className="font-medium">
                    {fileNameFromPath(filePath)}
                  </span>
                  <span className="max-w-full truncate text-[10px] text-muted-foreground">
                    {filePath}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClearRecent}>
                <Trash2 className="h-3.5 w-3.5" />
                Clear recent files
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Templates */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <FileCode className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Insert a diagram template</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Diagram Templates</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onTemplateSelect(TEMPLATES[key])}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Export */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export diagram</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Save to file</DropdownMenuLabel>
          <DropdownMenuItem onClick={onExportSvg}>
            <Download className="h-4 w-4" />
            Export as SVG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPng}>
            <Image className="h-4 w-4" />
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Copy to clipboard</DropdownMenuLabel>
          <DropdownMenuItem onClick={onCopyPng}>
            <ClipboardCopy className="h-4 w-4" />
            Copy as PNG
            <DropdownMenuShortcut>{modKey}+C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCopySvg}>
            <ClipboardCopy className="h-4 w-4" />
            Copy as SVG
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Preferences */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" onClick={onOpenPreferences}>
            <Settings className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Diagram preferences</p>
        </TooltipContent>
      </Tooltip>

      {/* Theme toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" onClick={onToggleTheme}>
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Toggle {theme === "light" ? "dark" : "light"} mode</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
