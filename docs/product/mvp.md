# AuraOS Memory Platform Scope

**Phase 2 — Months 4–9**

Phase 1 ships the [Character Platform](../features/character-platform.md) (Mochi, Pixel, Sakura, Nova, Ember). Phase 2 builds the second brain underneath — capture, search, workspaces, and timeline — and wires character interactions to real data.

The MVP proves one loop: **capture everything → find anything → ask Aura** — accessed through your companion.

## Goals

1. Zero-friction capture from anywhere on the desktop
2. Passive clipboard memory without user action
3. Fast local search (full-text + semantic)
4. AI chat grounded on user's own data (RAG)
5. Unified timeline and workspaces (trading, dev projects)
6. Character double-clicks open live features (not stubs)
7. 100% local data — nothing leaves the device without explicit user action

## In Scope

### Desktop Shell (extends Phase 1)

- Main Aura app window with sidebar navigation
- System tray with quick actions
- Global hotkeys:
  - `Ctrl+Shift+A` — Universal capture popup
  - `Ctrl+K` — Command palette

### Capture

- **Passive clipboard monitoring** — every copy saved automatically
- **Manual capture popup** — type picker with minimal fields:
  - Trade, Note, Idea, Screenshot, Task, Bookmark
- **Screenshot capture** — save with thumbnail
- **Auto-context** — attach source app, window title, timestamp

### Notes

- Create, read, update, delete notes
- Tags and basic organization
- Notes indexed for search immediately on save

### Search

- Full-text search across all captures
- Semantic (vector) search for natural-language queries
- Filters: type, date range, tags

### AI Chat

- Chat interface grounded on local data via RAG
- Bring-your-own-key for LLM provider (OpenAI, Anthropic, or local)
- Citations linking back to source captures

### Workspaces (Months 7–9)

- Memory Timeline UI
- Trading workspace (dashboard, journal, AI review)
- Developer workspace (projects, decisions, snippets)
- Tasks module
- Knowledge graph (entity extraction, auto-linking)
- Optional cloud sync

### Character Integration

- Mochi double-click → real Quick Notes
- Pixel double-click → real clipboard history
- Nova double-click → live AI search
- Ember double-click → trading chart board (when trading ships)
- Sakura double-click → journal with real entries

### Storage

- SQLite local database
- Vector index (sqlite-vec or LanceDB) for embeddings
- All data on device — no cloud dependency

### Navigation

| Route | Status in Phase 2 |
|-------|-------------------|
| Home | ✓ Briefing (yesterday/today) |
| Notes | ✓ Full |
| AI Chat | ✓ Full |
| Timeline | ✓ Full (Months 7–9) |
| Trading | ✓ Full (Months 7–9) |
| Projects | ✓ Full (Months 7–9) |
| Tasks | ✓ Full (Months 7–9) |
| Vault | ✓ Basic |
| Settings | ✓ Full |

See [Navigation](navigation.md) for full IA.

## Out of Scope (Explicit)

| Feature | Phase | Reason |
|---------|-------|--------|
| Voice notes | 3 | Capture complexity |
| Focus mode enforcement | 3 | Needs event system + coaching |
| MCP integrations | 3 | Needs stable capture API |
| VSCode plugin | 3 | Needs capture API |
| Character expansion (6–10) | 3 | Post-launch roster |
| Event-driven character reactions | 3 | Needs full data pipeline |

## Sprint Breakdown

### Sprints 1–4: Capture & Search (Months 4–5)

- SQLite schema and migrations
- Clipboard monitor (all platforms)
- Universal capture popup (`Ctrl+Shift+A`)
- Screenshot capture
- Capture pipeline → SQLite → TimelineEvent
- Notes CRUD with tags
- Full-text + vector search
- Wire Mochi/Pixel/Nova to real data

### Sprints 5–8: AI & Palette (Month 6)

- AI chat with RAG
- Command palette (`Ctrl+K`)
- Home briefing (yesterday/today summary)
- Sakura journal integration

### Sprints 9–12: Workspaces & Timeline (Months 7–9)

- Memory Timeline UI
- Trading workspace + Ember chart board
- Developer workspace + projects
- Tasks, knowledge graph
- Optional cloud sync
- Cross-platform testing

## Success Metrics

| Metric | Target |
|--------|--------|
| Capture-to-saved latency | < 2 seconds |
| Search response time (local) | < 1 second |
| Data residency | 100% on device |
| Clipboard capture reliability | > 99% of copy events |
| Character widget → real data | 100% of launch lineup |
| Platforms supported | Linux, macOS, Windows |

## Acceptance Criteria

- [ ] User can copy text and find it in Aura within 1 second
- [ ] User can press `Ctrl+Shift+A`, pick "Note", type content, and save in under 2 seconds
- [ ] User can search "docker compose" and find a clipboard entry from last week
- [ ] User can ask "what commands did I copy yesterday?" in AI chat and get cited answers
- [ ] Mochi double-click opens real notes; Nova opens live search
- [ ] Timeline shows full day of activity
- [ ] App installs and runs on Linux, macOS, and Windows without cloud account

## Technical Foundation

Phase 2 implements these data structures:

- `TimelineEvent` — unified activity index (see [Data Model](../architecture/data-model.md))
- `Capture` base record with type discrimination
- `ClipboardEntry` with dedup hash
- Entity tags on captures (feeds knowledge graph)

## Risks

| Risk | Mitigation |
|------|------------|
| Clipboard monitoring unreliable on some OS | Platform-specific Rust crates, extensive testing |
| Vector search slow on large datasets | sqlite-vec with indexing, pagination |
| LLM API latency | Async chat, streaming responses |
| Character stubs feel broken before data ships | Phase 1 uses placeholder UI; Phase 2 wires live |

## Related Docs

- [Roadmap](roadmap.md)
- [Character Platform](../features/character-platform.md) — Phase 1 scope
- [Navigation](navigation.md)
- [Architecture Overview](../architecture/overview.md)
- [Capture Pipeline](../architecture/capture-pipeline.md)
