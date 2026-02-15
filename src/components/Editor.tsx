import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { Code } from "lucide-react";

interface EditorProps {
  code: string;
  onChange: (value: string) => void;
  theme: "light" | "dark";
}

const lightTheme = EditorView.theme({
  "&": { backgroundColor: "oklch(0.985 0 0)" },
  ".cm-gutters": {
    backgroundColor: "oklch(0.965 0.001 286.375)",
    borderRight: "1px solid oklch(0.922 0.004 286.375)",
  },
});

export function Editor({ code, onChange, theme }: EditorProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-8 items-center gap-1.5 border-b bg-muted/50 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Code className="h-3.5 w-3.5" />
        Mermaid
      </div>
      <div className="editor-wrapper min-h-0 flex-1 overflow-auto">
        <CodeMirror
          value={code}
          onChange={onChange}
          height="100%"
          theme={theme === "dark" ? oneDark : lightTheme}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            bracketMatching: true,
            autocompletion: false,
          }}
          extensions={[EditorView.lineWrapping]}
        />
      </div>
    </div>
  );
}
