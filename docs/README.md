# AuraOS Documentation

AuraOS — Your AI Companion + Second Brain + Activity Memory.

## Quick Links

| Doc | Description |
|-----|-------------|
| [Product Vision](product/vision.md) | What AuraOS is and why it exists |
| [Character Platform](features/character-platform.md) | Phase 1 — characters as UI |
| [Memory Platform Scope](product/mvp.md) | Phase 2 — capture, search, workspaces |
| [Roadmap](product/roadmap.md) | Phase 1–3 timeline |
| [Timeline Feature](features/timeline.md) | Flagship data feature |
| [Architecture Overview](architecture/overview.md) | System design |

## Documentation Index

### Product

- [Vision](product/vision.md) — Problem statement, core areas, north star
- [Roadmap](product/roadmap.md) — Phased delivery plan
- [Memory Platform Scope](product/mvp.md) — Phase 2 scope, metrics, sprints
- [Navigation](product/navigation.md) — App IA, sidebar, routes
- [Character Roster](product/character-roster.md) — Phase 1 launch lineup + full specs

### Features

| Feature | Phase | Doc |
|---------|-------|-----|
| Character Platform | 1 | [character-platform.md](features/character-platform.md) |
| Character Physics | 1 | [character-physics.md](features/character-physics.md) |
| Companion Layer | 1 / 3 | [companion-layer.md](features/companion-layer.md) |
| Universal Capture | 2 | [universal-capture.md](features/universal-capture.md) |
| Clipboard Timeline | 2 | [clipboard-timeline.md](features/clipboard-timeline.md) |
| AI Search | 2 | [ai-search.md](features/ai-search.md) |
| Command Palette | 2 | [command-palette.md](features/command-palette.md) |
| Memory Timeline | 2 | [timeline.md](features/timeline.md) |
| Trading Workspace | 2 | [trading-workspace.md](features/trading-workspace.md) |
| Developer Workspace | 2 | [developer-workspace.md](features/developer-workspace.md) |
| Knowledge Graph | 2 | [knowledge-graph.md](features/knowledge-graph.md) |
| Focus Mode | 3 | [focus-mode.md](features/focus-mode.md) |

### Architecture

- [Overview](architecture/overview.md) — Components, modules, data flow
- [Tech Stack](architecture/tech-stack.md) — Framework and library choices
- [Data Model](architecture/data-model.md) — Entities, schemas, relationships
- [Character Engine](architecture/character-engine.md) — VRM rendering, window physics (Phase 1)
- [Capture Pipeline](architecture/capture-pipeline.md) — Ingestion and indexing (Phase 2)
- [Sync](architecture/sync.md) — Hybrid local/cloud sync (Phase 2)

### Architecture Decision Records

- [ADR Index](adr/README.md)
- [0001: Record architecture decisions](adr/0001-record-architecture-decisions.md)
- [0002: Use Tauri for desktop](adr/0002-use-tauri-for-desktop.md)

## Reading Order

For new contributors:

1. [Product Vision](product/vision.md)
2. [Character Platform](features/character-platform.md) — Phase 1
3. [Roadmap](product/roadmap.md)
4. [Memory Platform Scope](product/mvp.md) — Phase 2
5. [Character Engine](architecture/character-engine.md)
