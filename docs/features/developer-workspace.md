# Developer Workspace

**Phase 2**

Your coding memory — projects, decisions, snippets, and architecture notes in one place.

## Overview

Developers lose context constantly: Why did we choose Postgres aggregates? Where's that API endpoint definition? What was the architecture decision from May?

The Developer Workspace organizes captures by project and provides **decision memory** — a searchable log of technical choices with rationale.

## User Stories

1. As a developer, I want all my Sentinel-related notes, snippets, and screenshots in one place
2. As a developer, I want to log a decision and recall why we made it months later
3. As a developer, I want to see recent activity per project on a dashboard
4. As a developer, I want code snippets searchable by project and language
5. As a developer, I want architecture screenshots organized by project

## UX

### Projects List

```
┌──────────────────────────────────────────────────┐
│  Projects                          [+ New]       │
├──────────────────────────────────────────────────┤
│                                                    │
│  🟢 Sentinel                                      │
│     Rule engine · 47 captures · active today      │
│                                                    │
│  🟡 IdeaForge                                     │
│     Side project · 12 captures · 3 days ago     │
│                                                    │
│  🔵 Client A                                      │
│     Consulting · 89 captures · active yesterday   │
│                                                    │
│  🔵 Client B                                      │
│     Consulting · 34 captures · 1 week ago         │
│                                                    │
└──────────────────────────────────────────────────┘
```

### Project Hub (Sentinel)

```
┌──────────────────────────────────────────────────┐
│  ← Projects    Sentinel                          │
├──────────────────────────────────────────────────┤
│  [Notes] [Architecture] [Tasks] [Snippets]       │
│  [Screenshots] [Decisions]                       │
├──────────────────────────────────────────────────┤
│                                                    │
│  Recent Activity                                   │
│  13:40  Created Sentinel Rule — Tip > Bill       │
│  12:05  Meeting Notes — Clover rate-limit          │
│  11:00  Screenshot — Architecture diagram        │
│  09:12  Copied AWS deployment command              │
│                                                    │
│  Decisions                                         │
│  May 22  Use Postgres Aggregates — Performance     │
│  May 15  Redis for caching — Sub-ms lookups       │
│  May 10  Tauri over Electron — Binary size         │
│                                                    │
│  Open Tasks                                        │
│  ○ Finish Clover aggregation                     │
│  ○ Review failed trades                            │
│  ✓ Sentinel Rule Engine scaffold                   │
│                                                    │
└──────────────────────────────────────────────────┘
```

### Decision Memory

```
┌──────────────────────────────────────────────────┐
│  Decision — May 22, 2026                          │
├──────────────────────────────────────────────────┤
│                                                    │
│  Decided: Use Postgres Aggregates                  │
│                                                    │
│  Reason:                                           │
│  Performance — rule evaluation needs sub-10ms      │
│  queries on aggregated data. Raw row scans too     │
│  slow at 1M+ transactions/day.                   │
│                                                    │
│  Context:                                          │
│  Evaluated materialized views vs continuous        │
│  aggregates. PG aggregates won on freshness.       │
│                                                    │
│  Related:                                          │
│  • Clover API integration note                     │
│  • Architecture screenshot (May 20)                │
│  • Benchmark results snippet                       │
│                                                    │
└──────────────────────────────────────────────────┘
```

**Recall query:** *"Why did we use aggregates?"* → AI surfaces this decision with full context.

## Data Entities

| Entity | Table | Description |
|--------|-------|-------------|
| Project | `projects` | Name, slug, description, color |
| Decision | `decisions` | Decision text, reason, context, project_id |
| Capture | `captures` | Notes, snippets, screenshots linked via `project_id` |
| Task | `tasks` | Project-scoped tasks |
| Entity | `entities` | Auto-extracted project references |

See [Data Model](../architecture/data-model.md).

## Project Auto-Detection

Captures are linked to projects via:

1. **Explicit:** User selects project in capture popup
2. **Inferred:** Active app/window matches project keywords
3. **Tagged:** User tags capture with project name
4. **AI:** Entity extraction identifies project references

## Tabs

| Tab | Content |
|-----|---------|
| Notes | Markdown notes tagged to project |
| Architecture | Screenshots and diagrams |
| Tasks | Project-scoped task list |
| Snippets | Code snippets with syntax highlighting |
| Screenshots | Image gallery |
| Decisions | Decision log with recall |

## AI Behavior

### Decision Recall

- *"Why did we use Postgres aggregates?"* → Decision record + related captures
- *"What architecture decisions did we make for Sentinel?"* → All decisions for project
- *"When did we decide to use Redis?"* → Decision with date and context

### Project Summary

- Weekly project activity digest
- "What's stale?" — projects with no activity in 2+ weeks
- Cross-project search: *"Show all API endpoint definitions"*

## Phase

| Capability | Phase |
|------------|-------|
| Project CRUD | 2 |
| Project hub with tabs | 2 |
| Decision memory | 2 |
| Auto project detection | 2 |
| VSCode integration | 3 |
| Git commit linking | 3 |

## Open Questions

- Import from existing note apps (Obsidian vault, Notion export)?
- Git repo auto-linking (detect repo from active directory)?
- Shared projects (collaboration) — out of scope for personal tool?
- Code snippet syntax detection — auto or manual?

## Related Docs

- [Knowledge Graph](knowledge-graph.md)
- [Timeline](timeline.md)
- [Universal Capture](universal-capture.md)
- [Data Model](../architecture/data-model.md)
