# Command Palette

**Phase 2**

Like Cursor. `Ctrl+K` to search everything, navigate anywhere, and ask Aura.

## Overview

The Command Palette is the universal entry point for AuraOS. One shortcut gives access to navigation, search, capture actions, and AI queries — without leaving the current application.

## User Stories

1. As a user, I want to press `Ctrl+K` and instantly search all my captures
2. As a user, I want to navigate to any section without clicking the sidebar
3. As a user, I want to trigger actions (new note, screenshot) from the palette
4. As a user, I want recent items surfaced for quick access
5. As a user, I want to ask Aura a question directly from the palette

## UX

### Trigger

`Ctrl+K` (or `Cmd+K` on macOS) from anywhere — global hotkey.

### Palette Layout

```
┌──────────────────────────────────────────────────┐
│  🔍 Search everything...                          │
├──────────────────────────────────────────────────┤
│                                                    │
│  Recent                                            │
│  📝 Sentinel API design          note · 1 hr ago  │
│  📋 docker compose up            clip · 2 hr ago  │
│                                                    │
│  ── Type to search ──                              │
│                                                    │
│  Suggested                                         │
│  → Go to Timeline                                  │
│  → Go to Notes                                     │
│  → New Note                                        │
│  → Capture Screenshot                              │
│  → Ask Aura                                        │
│                                                    │
└──────────────────────────────────────────────────┘
```

### With Query

```
┌──────────────────────────────────────────────────┐
│  🔍 sentinel deploy                                │
├──────────────────────────────────────────────────┤
│                                                    │
│  Captures                                          │
│  📋 aws eks update-kubeconfig     clip · May 21   │
│  📋 docker compose up -d          clip · May 21   │
│  📝 Deployment steps              note · May 19   │
│                                                    │
│  Actions                                           │
│  → Ask Aura: "sentinel deploy"                     │
│  → Search Clipboard: "sentinel deploy"             │
│  → Go to Project: Sentinel                         │
│                                                    │
│  Navigation                                        │
│  → Go to Notes                                     │
│  → Go to Projects → Sentinel                       │
│                                                    │
└──────────────────────────────────────────────────┘
```

## Categories

| Category | Prefix | Examples | Phase |
|----------|--------|----------|-------|
| Navigation | `>` or auto | "Go to Timeline", "Settings" | 2 |
| Search Notes | auto | Fuzzy match note titles/content | 2 |
| Search Clipboard | auto | "docker compose" | 2 |
| Search Captures | auto | All capture types | 2 |
| Ask Aura | `?` prefix | "?what commands for sentinel" | 2 |
| Search Trades | auto | "Gold trades last week" | 2 |
| Search Projects | auto | "Sentinel" | 2 |
| Actions | `+` prefix | "+New note", "+Screenshot" | 2 |
| Character | auto | "Switch to Mochi", "Feed treat" | 1 |
| Settings | auto | "Change theme", "API key" | 2 |

### Prefix Modifiers

| Prefix | Action |
|--------|--------|
| (none) | Search all categories |
| `>` | Navigation only |
| `?` | Ask Aura (AI chat) |
| `+` | Actions only |
| `#` | Search by tag |
| `@` | Search by project (Phase 2) |

## Search Algorithm

1. **Fuzzy match** against all indexed content (title, content, tags)
2. **Recency boost** — recent items rank higher
3. **Type inference** — "trade" in query boosts trade results
4. **Action matching** — keyword match against available actions
5. **Navigation matching** — route names and aliases

Scoring: `fuzzy_score * 0.6 + recency_score * 0.3 + type_match * 0.1`

### Fuzzy Match

- Subsequence matching (like Cursor/VSCode command palette)
- Case insensitive
- Match highlight in results

## Actions

| Action | Shortcut in Palette | Phase |
|--------|-------------------|-------|
| New Note | `+note` | 2 |
| Capture Screenshot | `+screenshot` | 2 |
| Quick Capture | `+capture` | 2 |
| Ask Aura | `?` | 2 |
| Start Focus Session | `+focus` | 3 |
| Log Trade | `+trade` | 2 |
| New Task | `+task` | 2 |
| Switch Character | `+character` | 1 |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate results |
| `Enter` | Execute selected item |
| `Esc` | Close palette |
| `Tab` | Switch category filter |
| `Ctrl+K` | Toggle palette |

## AI Fallback

When no exact match found:

```
┌──────────────────────────────────────────────────┐
│  🔍 clover rate limit workaround                   │
├──────────────────────────────────────────────────┤
│                                                    │
│  No exact matches found.                           │
│                                                    │
│  → Ask Aura: "clover rate limit workaround"        │
│  → Search all captures (fuzzy)                     │
│                                                    │
└──────────────────────────────────────────────────┘
```

Selecting "Ask Aura" opens chat with query pre-filled.

## Data Sources

| Source | Indexed Fields |
|--------|---------------|
| Captures | title, content, tags |
| Clipboard | text |
| Projects | name, slug, description |
| Routes | name, aliases |
| Actions | name, keywords |
| Recent items | last 20 accessed items |

## Performance

| Metric | Target |
|--------|--------|
| Palette open | < 50ms |
| Search results (local) | < 100ms |
| Fuzzy match (10K items) | < 50ms |

## Phase

| Capability | Phase |
|------------|-------|
| Fuzzy search all captures | 2 |
| Navigation | 2 |
| Actions | 2 |
| Ask Aura fallback | 2 |
| Recent items | 2 |
| Prefix modifiers | 2 |
| Character switch | 1 |

## Open Questions

- Show preview pane for selected result (like VSCode)?
- Palette themes / compact mode?
- Custom user-defined actions/macros?
- Palette search analytics (popular queries)?

## Related Docs

- [AI Search](ai-search.md)
- [Universal Capture](universal-capture.md)
- [Navigation](../product/navigation.md)
