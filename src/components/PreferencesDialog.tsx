import { useState, useCallback, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  type DiagramPreferences,
  type MermaidTheme,
  DEFAULT_PREFERENCES,
} from "@/lib/store";

interface PreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: DiagramPreferences;
  onSave: (prefs: DiagramPreferences) => void;
}

const THEME_OPTIONS: { value: MermaidTheme; label: string; desc: string }[] = [
  { value: "default", label: "Default", desc: "Standard Mermaid colors" },
  { value: "dark", label: "Dark", desc: "Dark backgrounds, light text" },
  { value: "forest", label: "Forest", desc: "Green / nature tones" },
  { value: "neutral", label: "Neutral", desc: "Grayscale, minimal" },
  { value: "base", label: "Base", desc: "Clean, customizable base" },
];

const FONT_OPTIONS = [
  { value: '"Inter", "Segoe UI", system-ui, sans-serif', label: "Inter (default)" },
  { value: '"Fira Code", "Cascadia Code", monospace', label: "Fira Code" },
  { value: '"Segoe UI", system-ui, sans-serif', label: "Segoe UI" },
  { value: '"SF Pro", -apple-system, system-ui, sans-serif', label: "SF Pro (macOS)" },
  { value: "Georgia, serif", label: "Georgia (serif)" },
  { value: "monospace", label: "Monospace" },
  { value: "custom", label: "Custom..." },
];

export function PreferencesDialog({
  open,
  onOpenChange,
  preferences,
  onSave,
}: PreferencesDialogProps) {
  const [draft, setDraft] = useState<DiagramPreferences>(preferences);
  const [customFont, setCustomFont] = useState("");

  // Reset draft when dialog opens
  useEffect(() => {
    if (open) {
      setDraft(preferences);
      // Check if current font matches a preset
      const isPreset = FONT_OPTIONS.some(
        (o) => o.value !== "custom" && o.value === preferences.fontFamily
      );
      if (!isPreset) {
        setCustomFont(preferences.fontFamily);
      }
    }
  }, [open, preferences]);

  const isCustomFont = !FONT_OPTIONS.some(
    (o) => o.value !== "custom" && o.value === draft.fontFamily
  );

  const handleFontChange = useCallback((value: string) => {
    if (value === "custom") {
      setDraft((d) => ({ ...d, fontFamily: "" }));
    } else {
      setDraft((d) => ({ ...d, fontFamily: value }));
    }
  }, []);

  const handleReset = useCallback(() => {
    setDraft(DEFAULT_PREFERENCES);
    setCustomFont("");
  }, []);

  const handleSave = useCallback(() => {
    const finalPrefs = {
      ...draft,
      fontFamily: isCustomFont ? customFont || DEFAULT_PREFERENCES.fontFamily : draft.fontFamily,
    };
    onSave(finalPrefs);
    onOpenChange(false);
  }, [draft, isCustomFont, customFont, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Diagram Preferences</DialogTitle>
          <DialogDescription>
            Customize the look of your Mermaid diagrams for light and dark
            modes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Light theme */}
          <div className="space-y-2">
            <Label>Light mode theme</Label>
            <Select
              value={draft.lightTheme}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, lightTheme: v as MermaidTheme }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-medium">{opt.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {opt.desc}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dark theme */}
          <div className="space-y-2">
            <Label>Dark mode theme</Label>
            <Select
              value={draft.darkTheme}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, darkTheme: v as MermaidTheme }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-medium">{opt.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {opt.desc}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Font */}
          <div className="space-y-2">
            <Label>Font family</Label>
            <Select
              value={isCustomFont ? "custom" : draft.fontFamily}
              onValueChange={handleFontChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isCustomFont && (
              <input
                type="text"
                value={customFont}
                onChange={(e) => setCustomFont(e.target.value)}
                placeholder='e.g. "Comic Sans MS", cursive'
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            )}
          </div>

          <Separator />

          {/* Custom CSS */}
          <div className="space-y-2">
            <Label>Custom CSS</Label>
            <p className="text-xs text-muted-foreground">
              Extra CSS injected into every diagram. Use Mermaid class names
              like <code className="rounded bg-muted px-1">.node rect</code>,{" "}
              <code className="rounded bg-muted px-1">.edgeLabel</code>,{" "}
              <code className="rounded bg-muted px-1">.cluster rect</code>, etc.
            </p>
            <textarea
              value={draft.customCss}
              onChange={(e) =>
                setDraft((d) => ({ ...d, customCss: e.target.value }))
              }
              rows={5}
              placeholder={`.node rect {\n  rx: 8;\n  ry: 8;\n}\n.edgeLabel {\n  font-size: 12px;\n}`}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              spellCheck={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset to defaults
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
