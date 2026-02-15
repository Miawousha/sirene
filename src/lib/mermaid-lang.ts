/**
 * Custom CodeMirror language support for Mermaid syntax.
 *
 * Provides highlighting for:
 * - Diagram type keywords (graph, sequenceDiagram, classDiagram, etc.)
 * - Flow keywords (subgraph, end, participant, loop, alt, etc.)
 * - Arrow operators (-->, --->, -.->. ==>. etc.)
 * - Node shapes ([text], (text), {text}, etc.)
 * - Comments (%% ...)
 * - Strings ("..." and '...')
 * - Labels on edges (|text|)
 * - CSS-like class/style directives
 */

import {
  StreamLanguage,
  type StringStream,
  type StreamParser,
} from "@codemirror/language";

interface MermaidState {
  inString: false | '"' | "'";
  inComment: boolean;
  inBlockLabel: boolean;
}

const mermaidParser: StreamParser<MermaidState> = {
  startState(): MermaidState {
    return { inString: false, inComment: false, inBlockLabel: false };
  },

  token(stream: StringStream, state: MermaidState): string | null {
    // ── Continue string ─────────────────────────
    if (state.inString) {
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === state.inString) {
          state.inString = false;
          return "string";
        }
      }
      return "string";
    }

    // ── Skip whitespace ─────────────────────────
    if (stream.eatSpace()) return null;

    // ── Comments: %% to end of line ─────────────
    if (stream.match("%%")) {
      stream.skipToEnd();
      return "comment";
    }

    // ── Edge labels: |text| ─────────────────────
    if (stream.peek() === "|") {
      stream.next();
      if (state.inBlockLabel) {
        state.inBlockLabel = false;
        return "bracket";
      }
      state.inBlockLabel = true;
      return "bracket";
    }
    if (state.inBlockLabel) {
      while (!stream.eol()) {
        if (stream.peek() === "|") break;
        stream.next();
      }
      return "string";
    }

    // ── Strings ─────────────────────────────────
    const ch = stream.peek();
    if (ch === '"' || ch === "'") {
      state.inString = ch as '"' | "'";
      stream.next();
      return "string";
    }

    // ── Arrows (must test before operators) ─────
    // Long arrows first: thick, dotted, etc.
    if (
      stream.match(/^={3,}>/) ||
      stream.match(/^-{2,}->/) ||
      stream.match(/^-\.+-(?:>|-)/) ||
      stream.match(/^={2,}/) ||
      stream.match(/^-->/) ||
      stream.match(/^==>/) ||
      stream.match(/^-.->/) ||
      stream.match(/^-->/   ) ||
      stream.match(/^->>/) ||
      stream.match(/^-->>/) ||
      stream.match(/^<<-->>/) ||
      stream.match(/^<-->/) ||
      stream.match(/^--[xo]/) ||
      stream.match(/^-\.-/) ||
      stream.match(/^~~~/)
    ) {
      return "operator";
    }

    // ── Diagram type keywords (start of line) ───
    if (stream.sol()) {
      if (
        stream.match(
          /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|gitGraph|mindmap|timeline|journey|quadrantChart|sankey-beta|xychart-beta|block-beta|packet-beta|kanban|architecture-beta)\b/
        )
      ) {
        return "keyword";
      }
    }

    // ── Block/flow keywords ─────────────────────
    if (
      stream.match(
        /^(subgraph|end|participant|actor|loop|alt|else|opt|par|critical|break|rect|note|over|right of|left of|activate|deactivate|title|section|dateFormat|axisFormat|excludes|includes|todayMarker|class |classDef |click |style |linkStyle |direction |accTitle|accDescr)\b/
      )
    ) {
      return "keyword";
    }

    // ── Relationship keywords (ER, class) ───────
    if (stream.match(/^(as|is|of|where)\b/)) {
      return "keyword";
    }

    // ── Direction keywords ──────────────────────
    if (stream.match(/^(TB|TD|BT|RL|LR)\b/)) {
      return "atom";
    }

    // ── Shape brackets ──────────────────────────
    if (
      stream.match("[[") ||
      stream.match("]]") ||
      stream.match("((") ||
      stream.match("))") ||
      stream.match("{{") ||
      stream.match("}}")
    ) {
      return "bracket";
    }

    const c = stream.peek();
    if (c === "[" || c === "]" || c === "(" || c === ")" || c === "{" || c === "}") {
      stream.next();
      return "bracket";
    }

    // ── Colons (label separators) ───────────────
    if (c === ":") {
      stream.next();
      return "punctuation";
    }

    // ── Semicolons ──────────────────────────────
    if (c === ";") {
      stream.next();
      return "punctuation";
    }

    // ── ER relationship operators ───────────────
    if (stream.match(/^\|[|o{][-.][-.][-.][-.]?[|o{]\|/) || stream.match(/^[|o{][-.][-.]?[|o{]/)) {
      return "operator";
    }

    // ── Node IDs and text ───────────────────────
    if (stream.match(/^[A-Za-z_]\w*/)) {
      return "variableName";
    }

    // ── Numbers ─────────────────────────────────
    if (stream.match(/^\d+(\.\d+)?/)) {
      return "number";
    }

    // ── Skip any other char ─────────────────────
    stream.next();
    return null;
  },
};

export const mermaidLanguage = StreamLanguage.define(mermaidParser);
