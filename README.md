# AuraOS

**Your AI Companion + Second Brain + Activity Memory**

> Status: Phase 1 — Character Platform (in development)

AuraOS is a cross-platform desktop app where **VRM characters are the UI** for your second brain. Pick Mochi, Sakura, or Nova — they live on your desktop, react to your activity, and open your notes, clipboard, and memory.

Underneath, Aura will capture your digital life — clipboard, notes, screenshots, trades, decisions — and make it searchable through a unified timeline and AI-powered search. **Phase 1 ships the character layer first**; the memory platform follows in Phase 2.

## Launch Characters

| Character | Emoji | Role |
|-----------|-------|------|
| **Mochi** | 🐕 | Quick notes, tasks, cursor chase |
| **Pixel** | 🦝 | Clipboard history, screenshots |
| **Sakura** | 🌸 | Journal, reminders |
| **Nova** | 🤖 | AI search, holographic summaries |
| **Ember** | 🐉 | Vault guard, trading charts |

See [Character Roster](docs/product/character-roster.md) for full specs.

## Build Order

| Phase | Theme | Ships |
|-------|-------|-------|
| **1** *(now)* | Character Platform | VRM companions, physics, launch lineup |
| **2** | Memory & Workspaces | Capture, clipboard, search, timeline, trading |
| **3** | Intelligence & Integrations | Focus mode, voice, MCP, VSCode |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) stable — `make deps-rust` if `cargo` is missing
- npm or pnpm

Verify tools: `make doctor`

**Linux (Ubuntu/Debian)** — required for Tauri builds:

```bash
make deps-linux
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for macOS and Windows requirements.

## Quick Start

```bash
make deps-rust   # if cargo not found
make install     # npm dependencies
make models      # download CC0 VRM models for all characters
make doctor      # verify node + rust
make dev         # run Tauri app
```

This starts the **companion overlay** on your desktop (always on top). Open **Settings** from the **AuraOS icon in your system tray** (top bar on Linux/macOS, notification area on Windows).

Tray menu:

- **Settings…** — companion picker, appearance, movement
- **Show/Hide Companion** — toggle the overlay
- **Feed Treat** — spawn a sticky note on your companion
- **Quit AuraOS**

Run `make` or `make help` for all commands.

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all commands |
| `make deps-rust` | Install Rust via rustup (if cargo missing) |
| `make doctor` | Verify node, npm, cargo, rustc |
| `make install` | Install npm dependencies |
| `make deps-linux` | Install Linux system packages (sudo) |
| `make dev` | Run Tauri app |
| `make dev-ui` | Vite frontend only (no Rust backend) |
| `make build` | Build frontend (TypeScript + Vite) |
| `make release` | Build production Tauri binary |
| `make typecheck` | TypeScript check |
| `make check` | TypeScript + `cargo check` |
| `make manifest` | Regenerate `characters/manifest.json` |
| `make clean` | Remove `dist/` |
| `make clean-all` | Remove all build artifacts |

Equivalent npm scripts: `npm run tauri:dev`, `npm run build`, `npm run tauri:build`.

## What's Implemented (Phase 1)

- Tauri 2 transparent overlay (always on top) + system tray settings
- Five launch characters with full definition schema
- Three.js placeholder renderer (ready for VRM models)
- Animation state machine (sit, walk, run, celebrate, wave, …)
- Physics controller (anchor, locomotion, follow-cursor stub)
- Three-level interactions (single click, double click, long press)
- Spawnable desktop objects (sticky notes, memory orbs, …)
- Widget stubs (notes, clipboard, journal, search, vault)
- SQLite settings persistence (`~/.local/share/aura/aura.db`)

## Project Structure

```
aura/
├── Makefile                 # Dev commands (make help)
├── characters/              # Character packs + manifest.json
│   ├── mochi/
│   ├── pixel/
│   ├── sakura/
│   ├── nova/
│   └── ember/
├── src/
│   ├── character/
│   │   ├── engine/          # Animation, physics, input, spawner
│   │   ├── renderer/        # Three.js scene
│   │   ├── components/      # Overlay, widgets, speech bubbles
│   │   └── store/           # Zustand state
│   └── settings/            # Character picker UI
├── src-tauri/
│   └── src/
│       ├── character/       # Manifest loader
│       ├── window/          # Desktop geometry (stub)
│       ├── system/          # CPU / memory stats
│       └── db/              # SQLite settings
└── docs/                    # Product + architecture specs
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Desktop | Tauri 2 (Rust + React) |
| Characters | Three.js + `@pixiv/three-vrm` |
| State | Zustand |
| Database | SQLite (settings; full memory in Phase 2) |
| Platform | Linux, macOS, Windows |

See [Tech Stack](docs/architecture/tech-stack.md) and [ADR 0002](docs/adr/0002-use-tauri-for-desktop.md).

## Documentation

| Doc | Description |
|-----|-------------|
| [Product Vision](docs/product/vision.md) | What AuraOS is and why |
| [Character Platform](docs/features/character-platform.md) | Phase 1 — characters as UI |
| [Character Roster](docs/product/character-roster.md) | Launch lineup specs |
| [Roadmap](docs/product/roadmap.md) | Phase 1–3 timeline |
| [Memory Platform](docs/product/mvp.md) | Phase 2 scope |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Dev guide, deps, next steps |
| [Full Documentation](docs/README.md) | Complete doc index |

**Reading order:** Vision → Character Platform → [DEVELOPMENT.md](DEVELOPMENT.md) → run `make dev`.

## License

TBD
