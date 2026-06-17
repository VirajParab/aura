# Universal Capture

**Phase 2**

The primary ingestion point for intentional saves. One keystroke, one second, done.

## Overview

Universal Capture is the `Ctrl+Shift+A` popup that lets users save anything with minimal friction. It is the intentional counterpart to passive [clipboard monitoring](clipboard-timeline.md) — when you know something matters, you capture it explicitly.

**Target:** Capture-to-saved in under 2 seconds.

## User Stories

1. As a user, I want to save a thought without switching apps
2. As a trader, I want to quickly log a trade after it closes
3. As a developer, I want to save a code snippet with context
4. As a user, I want to bookmark a URL with a note
5. As a user, I want to create a task from anywhere

## UX Flow

### Trigger

User presses `Ctrl+Shift+A` (or `Cmd+Shift+A` on macOS) from any application.

### Capture Popup

```
┌────────────────────────┐
│ What are you saving?   │
├────────────────────────┤
│ Trade                  │
│ Note                   │
│ Idea                   │
│ Screenshot             │
│ Task                   │
│ Bookmark               │
└────────────────────────┘
```

### Type-Specific Forms

Each type shows minimal fields. Auto-context is always attached.

**Note:**
```
┌────────────────────────┐
│ Note                   │
├────────────────────────┤
│ [Auto-filled title]    │
│                        │
│ Content...             │
│                        │
│ Tags: [sentinel] [+]   │
│                        │
│ [Save]  [Cancel]       │
└────────────────────────┘
```

**Trade (Phase 2):**
```
┌────────────────────────┐
│ Trade                  │
├────────────────────────┤
│ Instrument? [Gold   ▼] │
│ Direction?  [Long   ▼] │
│ Entry?      [2345.50 ] │
│ P&L?        [+4800   ] │
│ Emotion?    [Confid.▼] │
│ Screenshot? [Attach  ] │
│                        │
│ [Save]  [Cancel]       │
└────────────────────────┘
```

**Screenshot:**
Immediately captures screen (or region) and saves with optional caption.

**Task (Phase 2):**
```
Title: [Finish Clover aggregation]
Due:   [Tomorrow        ▼]
Project: [Sentinel       ▼]
```

**Bookmark:**
```
URL:   [auto-detected from clipboard or browser]
Title: [auto-filled]
Note:  [optional]
```

**Idea:**
Like Note but tagged `idea` by default. Quick-capture mode — title optional.

### Auto-Context

Every capture automatically attaches:

| Field | Source |
|-------|--------|
| `source_app` | Active window application name |
| `source_title` | Active window title |
| `timestamp` | Current time |
| `clipboard_buffer` | Current clipboard text (if text) |
| `project_id` | Inferred from active app or recent context |

## Data Entities

| Entity | Table | Phase |
|--------|-------|-------|
| Capture (base) | `captures` | 2 |
| Screenshot file | `screenshots` | 2 |
| TimelineEvent | `timeline_events` | 2 |
| Tag | `tags`, `capture_tags` | 2 |
| Trade metadata | `captures.metadata` | 2 |
| Task | `tasks` | 2 |

See [Data Model](../architecture/data-model.md).

## Pipeline

1. Hotkey triggers popup (Tauri global shortcut)
2. User selects type and fills minimal fields
3. Auto-context collected from OS
4. Capture record created in SQLite
5. TimelineEvent created
6. Embedding generated for search
7. FTS index updated
8. Popup closes — user returns to previous app

See [Capture Pipeline](../architecture/capture-pipeline.md).

## AI Behavior

- **Title suggestion:** Pre-fill title from clipboard or window context
- **Tag suggestion:** Suggest tags based on content and recent tags
- **Project inference:** Match active app/window to known projects (Phase 2)

## Keyboard Flow

Optimized for speed — no mouse required:

1. `Ctrl+Shift+A` → popup opens
2. Type first letter of capture type (`N` for Note, `T` for Trade)
3. Tab through fields
4. `Enter` to save
5. Popup closes

## Phase

| Capability | Phase |
|------------|-------|
| Note, Idea, Screenshot, Bookmark | 2 |
| Trade, Task | 2 |
| Voice capture type | 3 |

## Open Questions

- Region screenshot vs full screen default?
- Should clipboard content auto-populate Note content field?
- Capture popup position: center screen vs near cursor?

## Related Docs

- [Clipboard Timeline](clipboard-timeline.md)
- [Timeline](timeline.md)
- [Capture Pipeline](../architecture/capture-pipeline.md)
- [Navigation](../product/navigation.md)
