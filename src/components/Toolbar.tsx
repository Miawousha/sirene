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

interface ToolbarProps {
  currentFile: string | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onCopyClipboard: () => void;
  onTemplateSelect: (template: string) => void;
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

export function Toolbar({
  currentFile,
  theme,
  onToggleTheme,
  onOpen,
  onSave,
  onSaveAs,
  onExportSvg,
  onExportPng,
  onCopyClipboard,
  onTemplateSelect,
}: ToolbarProps) {
  const fileName = currentFile ? currentFile.split(/[\\/]/).pop() : null;

  return (
    <div className="flex h-11 items-center gap-1 border-b bg-background px-3 select-none">
      {/* Logo / Title */}
      <span className="mr-2 text-sm font-bold tracking-tight text-primary">
        Sirene
      </span>

      {fileName && (
        <span className="mr-1 max-w-[200px] truncate text-xs text-muted-foreground">
          {fileName}
        </span>
      )}

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* File operations */}
      <ToolbarButton tooltip="Open file" shortcut="Ctrl+O" onClick={onOpen}>
        <FolderOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Open</span>
      </ToolbarButton>

      <ToolbarButton tooltip="Save" shortcut="Ctrl+S" onClick={onSave}>
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">Save</span>
      </ToolbarButton>

      <ToolbarButton
        tooltip="Save As"
        shortcut="Ctrl+Shift+S"
        onClick={onSaveAs}
      >
        <FilePlus className="h-4 w-4" />
      </ToolbarButton>

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
          <DropdownMenuItem onClick={onExportSvg}>
            <Download className="h-4 w-4" />
            Export as SVG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPng}>
            <Image className="h-4 w-4" />
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCopyClipboard}>
            <ClipboardCopy className="h-4 w-4" />
            Copy SVG to clipboard
            <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

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
