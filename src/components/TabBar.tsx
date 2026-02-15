import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TabBarProps {
  tabs: TabData[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

export function TabBar({ tabs, activeId, onSelect, onClose, onNew }: TabBarProps) {
  return (
    <div className="flex h-8 items-end gap-0 overflow-x-auto border-b bg-muted/30 px-1 select-none">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            className={cn(
              "group relative flex h-7 max-w-[180px] cursor-pointer items-center gap-1 rounded-t-md border border-b-0 px-2.5 text-[11px] transition-colors",
              isActive
                ? "border-border bg-background text-foreground"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            onClick={() => onSelect(tab.id)}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <span className="truncate">{tab.title}</span>
            <button
              className={cn(
                "ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm transition-opacity hover:bg-muted-foreground/20",
                isActive ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-0.5 mb-0.5 h-6 w-6"
            onClick={onNew}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>New tab</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
