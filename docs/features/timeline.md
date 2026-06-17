# Memory Timeline

**Phase 2 — Flagship Feature**

The Timeline is the north star of AuraOS. Every other feature exists to feed it. If we nail "memory of your digital life," everything else follows.

## Overview

The Memory Timeline is a chronological, searchable log of everything you do on your computer. It unifies clipboard copies, notes, screenshots, trades, tasks, decisions, git commits, and browser visits into a single stream grouped by day.

**The killer query:**

> *"What was I doing on May 21 when I discovered the Clover rate-limit issue?"*

Aura responds with:

- Terminal command (clipboard)
- Screenshot of the error
- Note you wrote
- Git commit
- Trade journal entry
- Browser page you had open

No other tool connects these dots.

## User Stories

1. As a user, I want to see everything I did today in one scrollable timeline
2. As a developer, I want to find what I was working on at a specific time last week
3. As a trader, I want to see my trades alongside the notes and screenshots from that session
4. As a user, I want related events auto-grouped when they happened close together
5. As a user, I want to ask natural-language questions about my past activity

## UX

### Daily Timeline View

```
┌──────────────────────────────────────────────────┐
│  Timeline                    ◀ May 21, 2026 ▶   │
├──────────────────────────────────────────────────┤
│                                                    │
│  09:12  📋 Copied AWS Command                     │
│         docker compose up -d --build               │
│         Terminal                                   │
│                                                    │
│  10:32  📈 Gold Trade +₹1,200                     │
│         Long · Confidence · Breakout               │
│                                                    │
│  11:00  📸 Screenshot Saved                       │
│         Architecture diagram — Sentinel rules      │
│                                                    │
│  12:05  📝 Meeting Notes                          │
│         Clover API rate-limit discussion           │
│                                                    │
│  13:40  📝 Created Sentinel Rule                  │
│         Tip > Bill fraud detection                 │
│                                                    │
│  ── Correlated Session ──                          │
│  14:00  📋 Copied: curl rate-limit test           │
│  14:05  📸 Screenshot: 429 error response         │
│  14:10  📝 Note: Clover rate-limit is 100/min     │
│                                                    │
└──────────────────────────────────────────────────┘
```

### Navigation

- **Today / Yesterday** quick tabs
- **Date picker** for any historical day
- **Filter chips:** All, Clipboard, Notes, Trades, Screenshots, Tasks
- **Search bar** with natural-language support (links to [AI Search](ai-search.md))

### Event Card

Each timeline entry shows:

| Field | Source |
|-------|--------|
| Time | `timestamp` |
| Icon | `event_type` mapping |
| Title | `title` |
| Summary | `summary` (1-line preview) |
| Source app | `source_app` |
| Tags | linked tags/entities |

Click to expand full content with links to related events.

## TimelineEvent Schema

See [Data Model](../architecture/data-model.md) for full SQL. Core fields:

```typescript
interface TimelineEvent {
  id: string;
  event_type: TimelineEventType;
  timestamp: string;          // ISO 8601
  title: string;              // display headline
  summary?: string;           // card preview
  content_ref: string;        // ID in source table
  content_table: string;      // captures | clipboard_entries | decisions | tasks
  source_app?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

type TimelineEventType =
  | 'clipboard_copy'
  | 'screenshot'
  | 'note'
  | 'trade'
  | 'task'
  | 'decision'
  | 'idea'
  | 'bookmark'
  | 'git_commit'
  | 'browser_visit'
  | 'voice_note';
```

### Event Type Icons

| event_type | Icon | Color |
|------------|------|-------|
| clipboard_copy | 📋 | Gray |
| screenshot | 📸 | Blue |
| note | 📝 | Green |
| trade | 📈 | Gold |
| task | ✓ | Purple |
| decision | ⚖️ | Orange |
| idea | 💡 | Yellow |
| bookmark | 🔖 | Teal |
| git_commit | 🔀 | Gray |
| browser_visit | 🌐 | Blue |
| voice_note | 🎤 | Red |

## Correlation Logic

Events that belong together are auto-grouped into **sessions**.

### Grouping Rules

1. **Time proximity:** Events within 30 minutes of each other
2. **Shared context:** Same `source_app`, `project_id`, or entity tags
3. **Explicit links:** User manually links events (Phase 2+)

### Example Session

User debugging Clover rate-limit between 14:00–14:15:

```
Session: "Clover rate-limit investigation"
  14:00  clipboard_copy  → curl test command
  14:05  screenshot      → 429 error response
  14:10  note             → "Clover rate-limit is 100/min"
  14:12  clipboard_copy  → fixed API endpoint
```

Sessions render as a collapsible group in the timeline with an auto-generated title from the most significant event.

## Natural-Language Queries

Powered by [AI Search](ai-search.md) + timeline context:

| Query | How Aura Answers |
|-------|-----------------|
| "What was I doing on May 21?" | Full day timeline summary |
| "When did I discover the Clover rate-limit issue?" | Correlated session from May 21 |
| "Show commands I copied for Sentinel deployment" | Filtered clipboard events + AI synthesis |
| "What trades did I take yesterday?" | Trade events with metadata |
| "Find the architecture screenshot from April" | Screenshot events filtered by date + semantic match |

### Query Pipeline

1. Parse intent (date range, event type, topic)
2. Filter `timeline_events` by structured criteria
3. Semantic search on matching events
4. LLM synthesizes answer with event citations
5. Render inline timeline cards in chat response

## Data Sources

| Source | How It Enters Timeline | Phase |
|--------|----------------------|-------|
| Clipboard monitor | Automatic on copy | 2 |
| Universal capture | Manual via `Ctrl+Shift+A` | 2 |
| Screenshot hotkey | Manual via `Ctrl+Shift+S` | 2 |
| Trade entry | Post-trade popup | 2 |
| Task create/complete | Tasks module | 2 |
| Decision log | Developer workspace | 2 |
| Git commits | MCP / git hook | 3 |
| Browser visits | Browser extension / MCP | 3 |
| Voice notes | Voice capture | 3 |

## AI Behavior

- **Daily summary:** End-of-day synthesis of timeline events (available on Home screen)
- **Session titling:** Auto-generate session names from event cluster
- **Anomaly detection:** "You copied 15 AWS commands today — deployment day?"
- **Cross-reference:** Link timeline events to knowledge graph entities

## Phase Breakdown

| Capability | Phase 1 | Phase 2 | Phase 3 |
|------------|---------|---------|---------|
| TimelineEvent creation | | ✓ | ✓ |
| Timeline UI | | ✓ | ✓ |
| Daily grouping | | ✓ | ✓ |
| Session correlation | | ✓ | ✓ |
| NL queries | | ✓ | ✓ |
| Git/browser events | | | ✓ |
| Voice note events | | | ✓ |

## Performance Targets

| Operation | Target |
|-----------|--------|
| Load day timeline | < 200ms for 500 events |
| Scroll (virtualized list) | 60fps |
| Date navigation | < 100ms |
| NL query with RAG | < 3 seconds |

## Open Questions

- Session grouping window: 30 minutes default — user-configurable?
- Timeline retention: keep all events forever or archive after N months?
- Should clipboard events be collapsed by default (show count + expand)?
- Export timeline as markdown/PDF?

## Related Docs

- [Vision](../product/vision.md) — The bet on Timeline
- [Data Model](../architecture/data-model.md) — TimelineEvent schema
- [Capture Pipeline](../architecture/capture-pipeline.md) — How events are created
- [AI Search](ai-search.md) — Natural-language queries
- [Clipboard Timeline](clipboard-timeline.md)
- [Universal Capture](universal-capture.md)
