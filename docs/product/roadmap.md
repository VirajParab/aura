# AuraOS Roadmap

## Overview

Three phases over ~12 months. **Characters ship first** — they are the UI. The memory platform (capture, timeline, workspaces) builds in Phase 2 on top of that foundation. Integrations and intelligence layer in Phase 3.

The [Timeline](../features/timeline.md) remains the north star for data; [Character Platform](../features/character-platform.md) is the north star for interaction.

## Phase Summary

| Phase | Timeline | Theme | Key Deliverables |
|-------|----------|-------|------------------|
| **Phase 1** | Months 1–3 | Character Platform | VRM characters, physics, launch lineup, marketplace |
| **Phase 2** | Months 4–9 | Memory & Workspaces | Capture, clipboard, search, timeline, trading, dev projects |
| **Phase 3** | Months 10–12 | Intelligence & Integrations | Focus mode, voice, MCP, VSCode, character coaching |

---

## Phase 1: Character Platform (Months 1–3)

**Goal:** Ship the character layer first — VRM companions with physics become the primary UI for Aura.

### Deliverables

- Tauri desktop app with transparent overlay window (Linux, macOS, Windows)
- VRM character engine (Three.js + window anchor system)
- Shared animation framework (17 core activities)
- Window physics: sit on borders, walk across monitors, hide behind windows
- 3-level click interactions (single, double, long press)
- Spawnable objects: sticky notes, task cards, memory orbs, chart boards
- **Launch lineup (5 characters):** Mochi, Pixel, Sakura, Nova, Ember
- Character onboarding picker
- Personality system (LLM tone per character)
- Basic state machine (Idle, Celebrate, Think, Warning)
- Character marketplace (community `.aura-char` packs)

### User Stories

- As a user, I want to pick a companion at first launch that matches my personality
- As a user, I want Mochi to chase my cursor and bring me notes
- As a trader, I want Ember to guard my vault and show trading charts
- As a professional, I want Nova to project holographic search and summaries
- As a creator, I want to publish VRM character packs to the marketplace

### Dependencies

- Tauri 2 scaffold with transparent overlay
- VRM rendering pipeline (see [Character Engine](../architecture/character-engine.md))
- Window geometry APIs (all platforms)
- SQLite local storage (minimal — character config, stub captures)

### Exit Criteria

- [ ] All 5 launch characters render with physics at 60fps
- [ ] Window anchor system works on Linux, macOS, Windows
- [ ] Double-click opens contextual widget per character
- [ ] At least 3 spawnable object types working
- [ ] Character picker at onboarding
- [ ] Marketplace supports publish and install
- [ ] App installs and runs on all three platforms

See [Character Platform](../features/character-platform.md) and [Character Roster](character-roster.md).

---

## Phase 2: Memory & Workspaces (Months 4–9)

**Goal:** Build the second brain underneath the characters — capture everything, organize into workspaces, surface the unified timeline.

Combines the former capture/search foundation and workspace/timeline features into one phase.

### Deliverables

**Capture & Search (Months 4–6)**

- Global hotkeys: `Ctrl+Shift+A` (capture), `Ctrl+K` (command palette)
- Passive clipboard monitoring
- Manual capture popup (Trade / Note / Idea / Screenshot / Task / Bookmark)
- Notes CRUD with tags
- Screenshot save with thumbnails
- Full-text + semantic search
- AI chat with RAG over local data
- Vector index + embeddings pipeline

**Workspaces & Timeline (Months 7–9)**

- Memory Timeline UI (daily grouping, date navigation)
- Trading workspace (dashboard, post-trade entry, end-of-day AI review)
- Developer workspace (projects, decisions, snippets)
- Tasks module
- Knowledge graph (entity extraction, auto-linking)
- Optional cloud sync (hybrid model)
- Wire character interactions to real data (Mochi fetches real notes, Nova searches real memory)

### User Stories

- As a developer, I want every copied command saved so I can find it later
- As a user, I want to capture a thought in under 2 seconds without leaving my current app
- As a user, I want to ask Aura a question and get answers from my own data
- As a trader, I want to log a trade in 10 seconds and see my stats
- As a developer, I want project-specific memory with decision recall
- As a user, I want to see everything I did today in one timeline
- As a user, I want my character's double-click to open real notes, not stubs

### Dependencies

- Phase 1 character platform stable
- SQLite + vector index
- LLM API integration (bring-your-own-key)
- TimelineEvent schema

### Exit Criteria

- [ ] Capture-to-saved in under 2 seconds
- [ ] Search returns relevant results in under 1 second (local)
- [ ] Timeline shows all event types for any day
- [ ] Trading dashboard displays win rate, profit factor, rule adherence
- [ ] Projects aggregate notes, snippets, screenshots, decisions
- [ ] Knowledge graph links entities from captures
- [ ] Character double-clicks open live Aura features (not stubs)
- [ ] Cloud sync optional and E2E encrypted
- [ ] 100% of data stays on device unless user opts into sync

See [MVP Scope](mvp.md) for sprint breakdown.

---

## Phase 3: Intelligence & Integrations (Months 10–12)

**Goal:** Make characters intelligent coaches and connect Aura to the outside world.

### Deliverables

- Character reactions wired to real events (compile fail, trade target, daily loss)
- Focus mode (deep work breaks, trading session enforcement)
- Voice note capture and transcription
- MCP integrations (browser, email, external tools)
- VSCode extension (capture snippets, show project context)
- Advanced character coaching (Hanuman focus, Sakura emotional journal)
- Post-launch character expansion (Yuki, Hanuman, Chiku, Orb, Ganesha)

### User Stories

- As a user, I want my character to notice I've been coding 90 minutes and suggest a break
- As a trader, I want Ember to block my dashboard when I hit my daily loss limit
- As a developer, I want to capture code snippets from VSCode directly
- As a user, I want to dictate a voice note while walking
- As a user, I want Mochi to celebrate when I complete a task

### Dependencies

- Phase 1 character state machine
- Phase 2 timeline, workspaces, and capture pipeline
- Active window detection APIs
- MCP server infrastructure

### Exit Criteria

- [ ] Characters react to 8+ real system/event states
- [ ] Focus mode detects VSCode and enforces trading rules
- [ ] Voice notes transcribed and indexed
- [ ] VSCode extension published
- [ ] At least 2 MCP integrations working
- [ ] Characters enhance (not distract from) core timeline experience

---

## Feature Phase Matrix

| Feature | Phase 1 | Phase 2 | Phase 3 |
|---------|---------|---------|---------|
| VRM Character Engine | ✓ | | |
| Launch Characters (5) | ✓ | | |
| Window Physics | ✓ | | |
| Spawnable Objects | ✓ | | |
| Character Marketplace | ✓ | | |
| Character Onboarding | ✓ | | |
| Universal Capture | | ✓ | |
| Clipboard Timeline | | ✓ | |
| Notes | | ✓ | |
| AI Search | | ✓ | |
| Command Palette | | ✓ | |
| AI Chat | | ✓ | |
| Memory Timeline | | ✓ | |
| Trading Workspace | | ✓ | |
| Developer Workspace | | ✓ | |
| Tasks | | ✓ | |
| Knowledge Graph | | ✓ | |
| Cloud Sync | | ✓ | |
| Character ↔ Data Wiring | | ✓ | |
| Voice Notes | | | ✓ |
| Focus Mode | | | ✓ |
| Event-Driven Reactions | | | ✓ |
| MCP Integrations | | | ✓ |
| VSCode Plugin | | | ✓ |
| Character Expansion (6–10) | | | ✓ |

## Related Docs

- [Vision](vision.md)
- [MVP](mvp.md) — Phase 2 memory platform scope
- [Character Roster](character-roster.md) — Phase 1 launch lineup
- [Navigation](navigation.md)
- [Architecture Overview](../architecture/overview.md)
