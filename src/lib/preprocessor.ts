/**
 * Mermaid Pre-Processor
 *
 * Automatically quotes node labels that contain characters the Mermaid parser
 * chokes on — parentheses, apostrophes, ampersands, semicolons, etc.
 *
 * Only rewrites flowchart / graph diagrams (the ones with node shapes like
 * `A[text]`, `B{text}`, `C(text)`). Other diagram types (sequence, class,
 * ER, gantt…) have a completely different syntax and are passed through
 * untouched.
 */

// Characters inside a label that require double-quoting
const NEEDS_QUOTING = /[()'"&#;]/;

// Diagram types that use flowchart node syntax
const FLOWCHART_TYPES = /^\s*(graph|flowchart)\b/i;

// Lines we should never touch
const SKIP_LINE =
  /^\s*(%%.*)$|^\s*$|^\s*(subgraph|end|direction|click|class |classDef |style |linkStyle )/;

/* ────────────────────────────────────────────────── */
/*  Public API                                        */
/* ────────────────────────────────────────────────── */

export function preprocessMermaid(source: string): string {
  const lines = source.split("\n");

  // Only auto-quote for flowchart / graph diagrams
  if (!isFlowchart(lines)) return source;

  return lines.map(preprocessLine).join("\n");
}

/* ────────────────────────────────────────────────── */
/*  Detect diagram type                               */
/* ────────────────────────────────────────────────── */

function isFlowchart(lines: string[]): boolean {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("%%")) continue;
    return FLOWCHART_TYPES.test(trimmed);
  }
  return false;
}

/* ────────────────────────────────────────────────── */
/*  Per-line processing                               */
/* ────────────────────────────────────────────────── */

function preprocessLine(line: string): string {
  if (SKIP_LINE.test(line)) return line;

  let result = line;

  // ── Compound brackets (longest delimiters first) ──────────

  // [[...]] subroutine
  result = autoQuoteShape(result, /([A-Za-z_]\w*)\[\[((?:[^\]]|\](?!\]))*)\]\]/g, "[[", "]]");

  // ((...)) circle / double-circle
  result = autoQuoteShape(result, /([A-Za-z_]\w*)\(\(((?:[^)]|\)(?!\)))*)\)\)/g, "((", "))");

  // {{...}} hexagon
  result = autoQuoteShape(result, /([A-Za-z_]\w*)\{\{((?:[^}]|\}(?!\}))*)\}\}/g, "{{", "}}");

  // ── Simple brackets (negative lookahead to skip compounds) ─

  // [...] rectangle — NOT [[
  result = autoQuoteShape(result, /([A-Za-z_]\w*)\[(?!\[)((?:[^\]])*)\](?!\])/g, "[", "]");

  // (...) stadium — NOT ((
  result = autoQuoteShape(result, /([A-Za-z_]\w*)\((?!\()((?:[^)])*)\)(?!\))/g, "(", ")");

  // {...} rhombus — NOT {{
  result = autoQuoteShape(result, /([A-Za-z_]\w*)\{(?!\{)((?:[^}])*)\}(?!\})/g, "{", "}");

  // >...] asymmetric flag
  result = autoQuoteShape(result, /([A-Za-z_]\w*)>((?:[^\]])*)\]/g, ">", "]");

  return result;
}

/* ────────────────────────────────────────────────── */
/*  Quoting helper                                    */
/* ────────────────────────────────────────────────── */

function autoQuoteShape(
  line: string,
  pattern: RegExp,
  open: string,
  close: string
): string {
  return line.replace(pattern, (_match, id: string, label: string) => {
    // Already double-quoted — leave alone
    if (label.startsWith('"') && label.endsWith('"')) {
      return `${id}${open}${label}${close}`;
    }

    // No problematic characters — leave alone
    if (!NEEDS_QUOTING.test(label)) {
      return `${id}${open}${label}${close}`;
    }

    // Escape any existing double-quotes inside the label
    const escaped = label.replace(/"/g, "&quot;");
    return `${id}${open}"${escaped}"${close}`;
  });
}
