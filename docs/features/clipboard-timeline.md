# Smart Clipboard Timeline

**Phase 2**

Every copy operation is remembered. Your clipboard becomes a searchable history.

## Overview

Aura passively monitors the system clipboard and saves every text copy as a `ClipboardEntry`. Users never need to think about saving — it happens automatically in the background.

Combined with the [Memory Timeline](timeline.md), clipboard history becomes a powerful recall tool:

> *"Show command copied last week"*

## User Stories

1. As a developer, I want every terminal command I copy saved automatically
2. As a user, I want to find something I copied yesterday without remembering which app
3. As a user, I want duplicate copies deduplicated so my history stays clean
4. As a user, I want sensitive data (passwords, API keys) filtered out
5. As a user, I want to search clipboard history by keyword or date

## UX

### Clipboard View (in Notes or dedicated section)

```
┌──────────────────────────────────────────────────┐
│  Clipboard History                    [Search]   │
├──────────────────────────────────────────────────┤
│  Today                                           │
│                                                  │
│  14:32  docker compose up -d --build             │
│         Terminal · 2 min ago                     │
│                                                  │
│  13:15  aws eks update-kubeconfig --region ...   │
│         Terminal · 1 hr ago                        │
│                                                  │
│  11:40  Gold breakout strategy notes             │
│         Chrome · 3 hr ago                          │
│                                                  │
│  09:05  Client feedback message draft            │
│         Slack · 5 hr ago                           │
│                                                  │
│  Yesterday                                       │
│                                                  │
│  16:20  SQL migration query                      │
│         DataGrip · yesterday                     │
│                                                  │
│  14:10  Sentinel API endpoint definition         │
│         VS Code · yesterday                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Search

- Full-text search via FTS5
- Date filters: today, yesterday, last 7 days, custom range
- Source app filter
- Accessible via Command Palette: `Ctrl+K` → type query

## Data Entities

```sql
-- See Data Model for full schema
clipboard_entries (
    id, text, content_hash, source_app, copied_at, is_sensitive
)
```

Each clipboard entry creates a `TimelineEvent` with `event_type = 'clipboard_copy'`.

See [Data Model](../architecture/data-model.md).

## Capture Behavior

### Monitoring

- Poll or event-driven clipboard listener (platform-specific)
- Runs in background via Tauri system tray
- Captures text content only in MVP (images in Phase 2)

### Dedup Strategy

| Rule | Behavior |
|------|----------|
| Same text within 5 seconds | Skip (OS double-fire) |
| Same `content_hash` within 1 hour | Skip (re-copy) |
| Same `content_hash` after 1 hour | Save as new entry (intentional re-copy) |

Hash: SHA-256 of normalized text (trimmed, lowercase).

### Sensitive Data Filtering

Entries matching heuristics are marked `is_sensitive = 1` and excluded from search/timeline by default. Stored in [Vault](../product/navigation.md) if user enables it.

**Heuristic patterns:**

| Pattern | Example |
|---------|---------|
| API key formats | `sk-...`, `AKIA...`, `ghp_...` |
| Password field context | Copied from password manager apps |
| Credit card numbers | Luhn-valid 16-digit sequences |
| High-entropy strings | > 32 chars, mixed case + symbols |
| User blocklist | Custom regex patterns in Settings |

Filtered entries are never sent to LLM context.

## AI Behavior

- Clipboard entries included in RAG context for [AI Search](ai-search.md)
- Query: *"What AWS commands did I use for Sentinel deployment?"* → searches clipboard + notes
- No AI processing of `is_sensitive` entries

## Platform Implementation

| Platform | API |
|----------|-----|
| Linux | `arboard` crate (X11/Wayland) |
| macOS | `NSPasteboard` change count |
| Windows | `AddClipboardFormatListener` |

Polling fallback: 500ms interval if event-driven unavailable.

## Performance

| Metric | Target |
|--------|--------|
| Capture latency | < 50ms after OS copy event |
| Memory overhead | < 10MB for monitor |
| Storage | ~100 bytes per entry (text only) |
| Dedup check | < 5ms |

## Settings

| Setting | Default |
|---------|---------|
| Clipboard monitoring | On |
| Sensitive data filtering | On |
| Image clipboard capture | Off (Phase 2) |
| Max history age | Unlimited |
| Max entries | 50,000 (oldest pruned) |

## Phase

| Capability | Phase |
|------------|-------|
| Text clipboard monitoring | 2 |
| Dedup + sensitive filtering | 2 |
| Image clipboard capture | 2 |
| Clipboard analytics ("most copied commands") | 2 |

## Open Questions

- Should users be able to "pin" clipboard entries?
- Clipboard image OCR for searchability (Phase 2)?
- Sync clipboard across devices (Phase 2) — privacy implications?
- Per-app exclusion list (e.g., skip password manager)?

## Related Docs

- [Universal Capture](universal-capture.md)
- [Timeline](timeline.md)
- [AI Search](ai-search.md)
- [Capture Pipeline](../architecture/capture-pipeline.md)
- [Data Model](../architecture/data-model.md)
