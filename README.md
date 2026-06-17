# AuraOS

**Your AI Companion + Second Brain + Activity Memory**

> Status: Phase 1 — Character Platform (in development)

AuraOS is a cross-platform desktop application where **VRM characters are the UI** for your second brain. Pick Mochi, Sakura, or Nova — they sit on your desktop, react to your life, and open your notes, clipboard, and memory.

Underneath, Aura captures your digital life — clipboard, notes, screenshots, trades, decisions — and makes it searchable through a unified timeline and AI-powered search.

## Build Order

| Phase | Theme | Ships |
|-------|-------|-------|
| **1** | Character Platform | VRM companions, physics, Mochi · Pixel · Sakura · Nova · Ember |
| **2** | Memory & Workspaces | Capture, clipboard, search, timeline, trading, dev projects |
| **3** | Intelligence & Integrations | Focus mode, voice, MCP, VSCode, event-driven coaching |

## Quick Links

| Doc | Description |
|-----|-------------|
| [Product Vision](docs/product/vision.md) | What AuraOS is and why |
| [Character Platform](docs/features/character-platform.md) | Phase 1 — characters as UI |
| [Memory Platform](docs/product/mvp.md) | Phase 2 — capture & workspaces |
| [Roadmap](docs/product/roadmap.md) | Phase 1–3 timeline |
| [Character Roster](docs/product/character-roster.md) | Launch lineup specs |
| [Full Documentation](docs/README.md) | Complete doc index |

## Core Features

| Feature | Phase | Description |
|---------|-------|-------------|
| [Character Platform](docs/features/character-platform.md) | 1 | VRM characters as UI — Mochi, Pixel, Sakura, Nova, Ember |
| [Universal Capture](docs/features/universal-capture.md) | 2 | `Ctrl+Shift+A` — save anything in 1 second |
| [Clipboard Timeline](docs/features/clipboard-timeline.md) | 2 | Every copy remembered and searchable |
| [AI Search](docs/features/ai-search.md) | 2 | Natural-language queries across all data |
| [Memory Timeline](docs/features/timeline.md) | 2 | Chronological log of your digital life |
| [Trading Workspace](docs/features/trading-workspace.md) | 2 | 10-second trade journal with AI review |
| [Developer Workspace](docs/features/developer-workspace.md) | 2 | Project memory with decision recall |
| [Focus Mode](docs/features/focus-mode.md) | 3 | Deep work and trading discipline |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Desktop | Tauri 2 (Rust + React) |
| Characters | Three.js + VRM |
| Database | SQLite + sqlite-vec |
| AI | Pluggable LLM (bring-your-own-key) |
| Platform | Linux, macOS, Windows |

See [Tech Stack](docs/architecture/tech-stack.md) and [ADR 0002](docs/adr/0002-use-tauri-for-desktop.md).

## Getting Started

```bash
npm install
npm run tauri:dev
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for system dependencies and project structure.

This repository includes the **Phase 1 character platform** scaffold:

- Tauri 2 + React + Three.js overlay
- 5 launch characters with full definition schema
- Animation, physics, input, and object spawner engines
- Settings UI for character selection

To understand the product:

1. Read the [Product Vision](docs/product/vision.md)
2. Review the [Character Platform](docs/features/character-platform.md)
3. See [DEVELOPMENT.md](DEVELOPMENT.md) to run locally

## License

TBD
