# Sirene

A lightweight desktop app for creating [Mermaid](https://mermaid.js.org/) diagrams with a live preview. Built with [Tauri 2](https://tauri.app/), React, and [shadcn/ui](https://ui.shadcn.com/).

**~3 MB installer** — no bundled browser, no Electron bloat.

## Features

- **Split-pane editor** — CodeMirror 6 on the left, live SVG preview on the right
- **Mermaid syntax highlighting** — custom CodeMirror language mode colors keywords, arrows, comments, strings
- **Multiple tabs** — open several `.mmd` files at once, `Ctrl+N` new tab, `Ctrl+W` close tab
- **Auto-save** — editor state persists to localStorage so nothing is lost on crash
- **Recent files** — quickly reopen recently used files from the toolbar
- **Zoomable preview** — scroll to zoom, Alt+drag to pan, fit-to-view button
- **8 diagram templates** — Flowchart, Sequence, Class, State, ER, Gantt, Pie, Git Graph
- **Smart preprocessor** — automatically quotes labels with special characters so `()`, `'`, `&` just work
- **File operations** — open / save `.mmd` files with native OS dialogs
- **Export** — SVG file, PNG file (2× retina), copy as PNG or SVG to clipboard
- **Ctrl+C → PNG** — click the diagram preview and press `Ctrl+C` (or `Cmd+C` on macOS) to copy the diagram as a PNG image, ready to paste into Word or Google Docs
- **Dark / light theme** — toggle or follow OS preference
- **Cross-platform** — Windows, macOS (Intel + Apple Silicon)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+C` | Copy diagram as PNG (when preview is focused) |

> On macOS, use `Cmd` instead of `Ctrl`.

## Screenshot

> *Start the app, pick a template, and edit — the preview updates in real time.*

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) 1.77+
- **Windows:** Visual Studio Build Tools with C++ workload
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)

### Development

```bash
# Install dependencies
npm install

# Run in dev mode (hot-reload frontend + Rust watcher)
npx tauri dev
```

### Build

```bash
# Production build — creates installer in src-tauri/target/release/bundle/
npx tauri build
```

**Windows output:**
- `src-tauri/target/release/bundle/nsis/Sirene_<version>_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/Sirene_<version>_x64_en-US.msi`

**macOS output:**
- `src-tauri/target/release/bundle/dmg/Sirene_<version>_<arch>.dmg`

## Project Structure

```
sirene/
├── src/                        # React frontend
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # Layout, state, keyboard shortcuts
│   ├── components/
│   │   ├── Toolbar.tsx         # File ops, templates, export, theme toggle
│   │   ├── TabBar.tsx          # Multi-tab bar with close/new buttons
│   │   ├── Editor.tsx          # CodeMirror 6 wrapper + Mermaid language
│   │   ├── Preview.tsx         # Mermaid renderer + zoom/pan viewport
│   │   ├── StatusBar.tsx       # Status indicator
│   │   └── ui/                 # shadcn/ui primitives
│   ├── hooks/
│   │   ├── useTheme.ts         # Dark/light + OS preference
│   │   └── useTabs.ts          # Multi-tab state, file ops, auto-save
│   ├── lib/
│   │   ├── clipboard.ts        # SVG→PNG conversion + native clipboard copy
│   │   ├── mermaid-lang.ts     # Custom CodeMirror language for Mermaid
│   │   ├── preprocessor.ts     # Auto-quote labels with special chars
│   │   ├── store.ts            # localStorage persistence (tabs, recent files)
│   │   ├── templates.ts        # 8 Mermaid diagram templates
│   │   └── utils.ts            # cn() utility
│   └── styles/
│       └── index.css           # Tailwind v4 + shadcn theme
├── src-tauri/                  # Rust backend
│   ├── src/lib.rs              # Plugin registration
│   ├── tauri.conf.json         # Window, build, permissions config
│   └── capabilities/           # Tauri v2 permission system
├── .github/workflows/
│   └── release.yml             # CI: builds Windows + macOS on tag push
├── package.json
└── vite.config.ts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Tauri 2](https://tauri.app/) (Rust + OS WebView) |
| Frontend | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) |
| Editor | [CodeMirror 6](https://codemirror.net/) |
| Diagrams | [Mermaid.js](https://mermaid.js.org/) |
| Split pane | [Allotment](https://github.com/johnwalley/allotment) |
| Icons | [Lucide](https://lucide.dev/) |

## Releases

Pushing a version tag triggers GitHub Actions to build installers for all platforms:

```bash
git tag v0.2.0
git push origin v0.2.0
```

The workflow creates a draft release with:
- Windows: `.exe` (NSIS) + `.msi`
- macOS Intel: `.dmg`
- macOS Apple Silicon: `.dmg`

Go to [Releases](https://github.com/Miawousha/sirene/releases) to download.

## License

MIT
