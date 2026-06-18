# AuraOS

**A desktop companion that *is* your second brain — not another app in your dock.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey)]()
[![Stack](https://img.shields.io/badge/stack-Tauri%202%20%2B%20React%20%2B%20Three.js-61dafb)]()

> **Early & open.** Phase 1 is live — VRM companions on your desktop, local memory, clipboard timeline. We're building in public.

---

## Why AuraOS?

You already have Notion for notes, a clipboard manager, a trading journal, and twelve browser tabs of "I'll read this later." None of them talk to each other. Context disappears.

**AuraOS connects the dots** — and puts a character on your desktop who *is* the interface:

| Old way | Aura way |
|--------|----------|
| Open sidebar → Notes | Mochi brings you a sticky note |
| Search bar → query | Nova projects a holographic search |
| Clipboard app → history | Pixel collects what you copied |
| Trading dashboard → stats | Ember guards the vault & charts |

Your companion sits on top of your workspace (click-through when you need focus), reacts to what you're doing, and opens the right tool with a **click, double-click, or long-press**.

```
     📝 Quick Note          ✅ Task
           \               /
            \   🐕 Mochi   /     ← long-press → radial action menu
             \___________/
                  │
         [ your desktop — VS Code, terminal, browser... ]
```

---

## Meet the launch roster

Five characters. Five audiences. One engine.

| | Character | Vibe | Your superpower |
|---|-----------|------|-----------------|
| 🐕 | **Mochi** | Loyal shiba puppy | Quick notes, tasks, cursor chase |
| 🦝 | **Pixel** | Curious collector | Clipboard history & screenshots |
| 🌸 | **Sakura** | Gentle coach | Journal & reminders |
| 🤖 | **Nova** | Holographic AI | Search & memory summaries |
| 🐉 | **Ember** | Vault guardian | Trading charts & secrets |

Each character shares the same physics, animation, and interaction engine — but different personalities, spawn objects, and widgets. [Full roster →](docs/product/character-roster.md)

---

## What works today

This isn't a mockup repo. You can run it now.

**Companion layer**
- Transparent always-on-top overlay (Tauri 2) + system tray
- VRM characters via Three.js + `@pixiv/three-vrm`
- 17+ activities — sit, walk, run, sleep, wave, dance, celebrate…
- Window physics, cursor follow, ambient behaviors
- Single / double / **long-press** interactions
- Radial action menu — fast-access notes & tasks in a semi-circle above your companion
- Spawnable desktop objects (sticky notes, task cards, memory orbs, chart boards…)

**Memory & capture** *(Phase 2 foundation — shipping incrementally)*
- SQLite local store (`~/.local/share/aura/aura.db`)
- Passive clipboard monitoring & searchable history
- Notes, tasks, timeline events, universal capture
- `Ctrl+Shift+A` capture · `Ctrl+K` command palette
- Widget panels wired to real local data

**Platform**
- Linux (X11 + Wayland input regions), macOS, Windows
- Rust backend — window geometry, system stats, global shortcuts

<!-- Add a demo GIF here when ready: ![AuraOS demo](docs/assets/demo.gif) -->

---

## Quick start

**Requirements:** Node 20+, Rust stable, npm

```bash
git clone https://github.com/VirajParab/aura.git
cd aura

make deps-rust    # if cargo isn't installed
make install      # npm deps
make models       # CC0 VRM models for all characters
make doctor       # sanity check
make dev          # launch the companion overlay
```

**Linux (Ubuntu/Debian)** — install Tauri system deps first:

```bash
make deps-linux
```

After launch, find **AuraOS in your system tray** → Settings to pick your character, scale, and movement.

| Tray action | What it does |
|-------------|--------------|
| **Settings…** | Character picker, opacity, follow cursor |
| **Show/Hide Companion** | Toggle overlay |
| **Feed Treat** | Spawn a sticky note |
| **Quit** | Exit |

More commands: `make help` · Full dev guide: [DEVELOPMENT.md](DEVELOPMENT.md)

---

## Built for hackers

If you ever wanted a **Tamagotchi meets Obsidian** on the desktop — this is the codebase.

```
aura/
├── characters/          # Character packs (JSON + VRM) — add your own
├── src/character/
│   ├── engine/          # Physics, animation, input, spawner, platform logic
│   ├── renderer/        # Three.js + VRM pipeline
│   └── components/      # Overlay, radial menu, widgets
├── src-tauri/src/       # Rust — tray, DB, clipboard, overlay input, shortcuts
└── docs/                # Product vision, physics spec, architecture ADRs
```

| Layer | Tech |
|-------|------|
| Desktop shell | [Tauri 2](https://tauri.app/) |
| UI | React 19 + TypeScript + Vite |
| Characters | Three.js + `@pixiv/three-vrm` |
| State | Zustand |
| Data | SQLite (rusqlite) |
| License | [AGPL-3.0](LICENSE) |

**Good first issues territory:** new character packs, activity poses, widget panels, Linux/Wayland polish, MCP hooks (Phase 3).

---

## Roadmap

We're shipping in three phases. [Full roadmap →](docs/product/roadmap.md)

| Phase | Theme | Status |
|-------|-------|--------|
| **1** | Character platform — VRM, physics, interactions | **In progress** |
| **2** | Memory & workspaces — capture, timeline, trading, dev projects | Foundation landing |
| **3** | Intelligence — focus mode, voice, MCP, VSCode extension | Planned |

Star the repo if you want Phase 2 memory search and Nova RAG on your desktop.

---

## Open source vs premium

**This repo is the community edition** — free, self-hosted, [AGPLv3](LICENSE).

| Open source (here) | Premium / hosted (separate) |
|--------------------|----------------------------|
| Full desktop companion & character engine | Aura Cloud sync & backup |
| Local SQLite memory & clipboard timeline | Managed AI (no BYOK required) |
| BYOK LLM integrations | Official marketplace & paid character packs |
| Community `.aura-char` packs | Broker integrations & enterprise SSO |

Details: [Open-core split](#open-source-vs-premium) below · Commercial licensing: [CLA.md](CLA.md)

<details>
<summary><strong>Full open-core breakdown</strong></summary>

### Open source (AGPLv3)

Free to use, modify, and self-host. Network deployments must share source under AGPL.

- Character platform — overlay, VRM, physics, interactions, radial menu, launch roster
- Local memory — SQLite, clipboard, notes, tasks, capture hotkeys, command palette
- Companion UX — tray, spawn objects, widget panels on local data
- Developer tools — character schema, build pipeline, community packs
- Self-hosted AI — bring your own API keys

### Premium & commercial

Contact the copyright holder for a [commercial license](CLA.md).

- Aura Cloud · Hosted intelligence · Marketplace · Trading integrations · Team/enterprise · White-label

</details>

---

## Contributing

We'd love your help — new characters, engine improvements, docs, bug fixes.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Sign the [Contributor License Agreement (CLA.md)](CLA.md) *(by submitting a PR)*
3. Run `make check` before opening a PR

**Reading order for new contributors:** [Vision](docs/product/vision.md) → [Character Platform](docs/features/character-platform.md) → [DEVELOPMENT.md](DEVELOPMENT.md) → `make dev`

---

## Documentation

| Doc | What's inside |
|-----|----------------|
| [Product Vision](docs/product/vision.md) | The problem & the morning-briefing UX |
| [Character Platform](docs/features/character-platform.md) | Characters as UI — interactions & spawns |
| [Character Physics](docs/features/character-physics.md) | Walk, fall, anchor, patrol |
| [Character Roster](docs/product/character-roster.md) | Deep specs for every character |
| [Roadmap](docs/product/roadmap.md) | Phase 1–3 timeline |
| [Memory Platform](docs/product/mvp.md) | Phase 2 capture & search |
| [All docs](docs/README.md) | Complete index |

---

## License

Copyright (c) 2026 viraj.

AuraOS is **free software** under the [GNU Affero General Public License v3.0](LICENSE) (or later). You may use, modify, and distribute it under those terms. If you run a modified version as a network service, AGPL requires offering source to your users.

Commercial licensing for premium features or proprietary deployment: see [CLA.md](CLA.md).

---

<p align="center">
  <sub>Built with 🐕 for people who miss the desktop pet era — but need a second brain.</sub>
</p>
