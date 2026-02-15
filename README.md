# Sirene

A lightweight desktop app for creating [Mermaid](https://mermaid.js.org/) diagrams with a live preview. Built with [Tauri 2](https://tauri.app/), React, and [shadcn/ui](https://ui.shadcn.com/).

**~3 MB installer** — no bundled browser, no Electron bloat.

## Features

- **Split-pane editor** — CodeMirror 6 on the left, live SVG preview on the right
- **Zoomable preview** — scroll to zoom, Alt+drag to pan, fit-to-view button
- **8 diagram templates** — Flowchart, Sequence, Class, State, ER, Gantt, Pie, Git Graph
- **Smart preprocessor** — automatically quotes labels with special characters so `()`, `'`, `&` just work
- **File operations** — open / save `.mmd` files with native OS dialogs
- **Export** — SVG, PNG (2x retina), clipboard copy
- **Dark / light theme** — toggle or follow OS preference
- **Keyboard shortcuts** — `Ctrl+S` save, `Ctrl+Shift+S` save as, `Ctrl+O` open
- **Cross-platform** — Windows, macOS (Intel + Apple Silicon)

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
│   │   ├── Editor.tsx          # CodeMirror 6 wrapper
│   │   ├── Preview.tsx         # Mermaid renderer + zoom/pan viewport
│   │   ├── StatusBar.tsx       # Status indicator
│   │   └── ui/                 # shadcn/ui primitives
│   ├── hooks/
│   │   ├── useTheme.ts         # Dark/light + OS preference
│   │   └── useFileOperations.ts
│   ├── lib/
│   │   ├── preprocessor.ts     # Auto-quote labels with special chars
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
