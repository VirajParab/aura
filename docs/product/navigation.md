# AuraOS Navigation & Information Architecture

## App Structure

```
┌─────────────────────┐
│ AuraOS              │
├─────────────────────┤
│ Home                │
│ Timeline            │
│ Notes               │
│ Trading             │
│ Projects            │
│ Tasks               │
│ Vault               │
│ AI Chat             │
│ Settings            │
└─────────────────────┘
```

## Route Definitions

| Route | Path | Description | Phase |
|-------|------|-------------|-------|
| Home | `/` | Morning briefing, quick capture, recent activity | 2 |
| Timeline | `/timeline` | Chronological memory log | 2 |
| Notes | `/notes` | Note list and editor | 2 |
| Trading | `/trading` | Trading dashboard and journal | 2 |
| Projects | `/projects` | Developer project hubs | 2 |
| Tasks | `/tasks` | Task management | 2 |
| Vault | `/vault` | Sensitive captures (filtered clipboard, credentials) | 2 |
| AI Chat | `/chat` | Conversational search and Q&A | 2 |
| Settings | `/settings` | Preferences, API keys, companion, sync | 1 |

**Phase 1:** Character overlay is the primary UI. Main app window is minimal (Settings, character picker). Character double-clicks open stub widgets that become live in Phase 2.

## Phase Availability

### Phase 1 (Character Launch)

```
┌─────────────────────┐
│ AuraOS              │
├─────────────────────┤
│ Character Overlay ✓ │  ← primary UI (Mochi, Pixel, etc.)
│ Settings        ✓   │
├─────────────────────┤
│ Home                │  ← hidden (Phase 2)
│ Timeline            │  ← hidden
│ Notes               │  ← via character widget stub
│ Trading             │  ← hidden
│ Projects            │  ← hidden
│ Tasks               │  ← hidden
│ Vault               │  ← hidden
│ AI Chat             │  ← via Nova widget stub
└─────────────────────┘
```

### Phase 2

All routes active. Characters wire to live data. Timeline becomes primary in-app navigation target alongside character.

### Phase 3+

Event-driven character reactions on all routes. Focus mode toggle in header.

## Home Screen (Phase 2)

```
┌──────────────────────────────────────────────┐
│  Good morning, Viraj                         │
├──────────────────────────────────────────────┤
│  Yesterday                                   │
│  ✓ Worked on Sentinel Rule Engine            │
│  ✓ Traded Gold +₹4,800                       │
│  ✓ Saved 3 architecture screenshots          │
│  ✓ Copied AWS deployment commands            │
├──────────────────────────────────────────────┤
│  Today                                         │
│  • Finish Clover aggregation                  │
│  • Journal trading session                    │
│  • Review failed trades                       │
├──────────────────────────────────────────────┤
│  Recent Captures                              │
│  [clipboard] docker compose up — 2 min ago    │
│  [note] Sentinel API design — 1 hr ago        │
│  [screenshot] Architecture diagram — 3 hr ago │
├──────────────────────────────────────────────┤
│  [Ctrl+Shift+A Capture]  [Ctrl+K Search]      │
└──────────────────────────────────────────────┘
```

## Global Shortcuts

| Shortcut | Action | Phase |
|----------|--------|-------|
| `Ctrl+Shift+A` | Open universal capture popup | 2 |
| `Ctrl+K` | Open command palette | 2 |
| `Ctrl+Shift+T` | Quick note | 2 |
| `Ctrl+Shift+S` | Screenshot capture | 2 |
| Click character | Character interaction | 1 |

Platform note: On macOS, `Ctrl` maps to `Cmd` where appropriate.

## Command Palette Categories

| Category | Examples | Phase |
|----------|----------|-------|
| Navigate | "Go to Timeline", "Open Settings" | 2 |
| Search Notes | Fuzzy match note titles and content | 2 |
| Search Clipboard | "docker compose", "aws eks" | 2 |
| Search Captures | All capture types | 2 |
| Ask Aura | Natural-language query → AI chat | 2 |
| Search Trades | "Gold trades last week" | 2 |
| Search Projects | "Sentinel", "Client A" | 2 |
| Actions | "New note", "Capture screenshot" | 2 |
| Character | "Switch to Mochi", "Feed treat" | 1 |

## Settings Sections

| Section | Contents | Phase |
|---------|----------|-------|
| Characters | Active companion, picker, treat interactions, physics | 1 |
| General | Theme, startup behavior, hotkey customization | 2 |
| Capture | Clipboard monitoring toggle, sensitive data filters | 2 |
| AI | LLM provider, API key, model selection | 2 |
| Sync | Cloud account, E2E encryption | 2 |
| Trading | Daily limits, instruments, rule definitions | 2 |
| Advanced | Data export, database location, debug logs | 2 |

## Related Docs

- [Vision](vision.md)
- [Roadmap](roadmap.md)
- [Character Platform](../features/character-platform.md)
- [Command Palette](../features/command-palette.md)
