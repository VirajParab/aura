# Knowledge Graph

**Phase 2**

Auto-linking captures into a connected knowledge network.

## Overview

When you save "Clover API", "Fraud Rule", and "Tip > Bill" separately, Aura recognizes they are related and links them. Over time, your captures form a graph of concepts, projects, APIs, and rules — making discovery intuitive.

## User Stories

1. As a user, I want related captures linked automatically without manual tagging
2. As a developer, I want to see how Sentinel connects to Clover, Fraud Engine, and Rule Aggregates
3. As a user, I want to explore connections from any capture
4. As a user, I want the graph to improve as I add more captures
5. As a developer, I want to manually create and edit entity links

## UX

### Graph Visualization (Phase 2)

```
┌──────────────────────────────────────────────────┐
│  Knowledge Graph — Sentinel                       │
├──────────────────────────────────────────────────┤
│                                                    │
│              Sentinel                              │
│              /  |  \                               │
│             /   |   \                              │
│         Clover  Fraud  Rule                        │
│           |    Engine  Aggregates                  │
│           |      |                                 │
│        Rate    Tip > Bill                          │
│        Limit                                       │
│                                                    │
│  [Click node to view captures]                    │
│                                                    │
└──────────────────────────────────────────────────┘
```

### Inline Links (All Phases)

On any capture detail view:

```
Related:
  • Clover API (3 captures)
  • Fraud Rule (2 captures)
  • Tip > Bill (1 capture)
```

### Example

User saves over time:

1. Note: "Clover API integration for transaction data"
2. Note: "Fraud rule: Tip > Bill detection"
3. Screenshot: Sentinel architecture with Clover and Fraud Engine

Aura links:

```
Sentinel
  |
  ├ Clover (API)
  |
  ├ Fraud Engine
  |   └ Tip > Bill (rule)
  |
  └ Rule Aggregates
```

## Data Entities

| Entity | Table | Description |
|--------|-------|-------------|
| Entity | `entities` | Named concept (name, type) |
| EntityLink | `entity_links` | Relationship between entities |
| CaptureEntity | `capture_entities` | Capture mentions entity |

### Entity Types

| Type | Examples |
|------|----------|
| `project` | Sentinel, IdeaForge, Client A |
| `api` | Clover API, Sentinel API |
| `rule` | Tip > Bill, Rate Limit Check |
| `instrument` | Gold, Silver, Nifty |
| `person` | Client contact names |
| `concept` | Postgres Aggregates, Rate Limiting |

See [Data Model](../architecture/data-model.md).

## Entity Extraction Pipeline

### Tag-Based Linking (Phase 2 early)

- Tag-based linking: captures with same tags are related
- Project assignment links captures to project entities

### Auto-Extraction (Phase 2)

1. On capture save, extract named entities from content
2. Match against existing entities (fuzzy match)
3. Create new entities for unknown names
4. Generate `entity_links` based on co-occurrence
5. Confidence score: 1.0 = manual, 0.5–0.9 = auto-extracted

### Extraction Methods

| Method | Phase | Accuracy |
|--------|-------|----------|
| Tag matching | 2 | High (manual) |
| Keyword matching | 2 | Medium |
| LLM entity extraction | 2 | High |
| Co-occurrence linking | 2 | Medium |

### LLM Extraction Prompt

```
Extract named entities from this capture. Return JSON:
{
  "entities": [
    { "name": "Clover API", "type": "api" },
    { "name": "Tip > Bill", "type": "rule" }
  ],
  "relationships": [
    { "source": "Tip > Bill", "target": "Fraud Engine", "type": "part_of" }
  ]
}
```

## AI Behavior

- *"What's connected to Clover API?"* → Graph traversal + capture list
- *"Show me the fraud detection context"* → Fraud Engine node + all linked captures
- Graph-informed search: queries expand to related entities automatically

## Phase

| Capability | Phase |
|------------|-------|
| Tag-based linking | 2 |
| Entity tables + manual links | 2 |
| Auto-extraction (LLM) | 2 |
| Graph visualization | 2 |
| Graph-informed search | 2 |
| Graph export | 3 |

## Open Questions

- Auto-extraction quality bar: show low-confidence links or hide them?
- Max graph depth for visualization (2 hops? 3 hops?)?
- Merge duplicate entities (e.g., "Clover API" vs "Clover")?
- Obsidian-style `[[wiki links]]` in note content?

## Related Docs

- [Developer Workspace](developer-workspace.md)
- [Timeline](timeline.md)
- [AI Search](ai-search.md)
- [Data Model](../architecture/data-model.md)
