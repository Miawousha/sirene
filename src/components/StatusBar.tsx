import { cn } from "@/lib/utils";

interface StatusBarProps {
  error: string | null;
  currentFile: string | null;
}

export function StatusBar({ error, currentFile }: StatusBarProps) {
  return (
    <div className="flex h-6 items-center gap-3 border-t bg-muted/50 px-3 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            error ? "bg-destructive" : "bg-emerald-500"
          )}
        />
        {error ? "Error" : "Ready"}
      </div>
      <div className="flex-1" />
      {currentFile && (
        <span className="max-w-xs truncate opacity-70">{currentFile}</span>
      )}
      <span>Mermaid</span>
    </div>
  );
}
