# Tech Stack

## Summary

| Layer | Choice | Phase |
|-------|--------|-------|
| Desktop shell | Tauri 2 | 1 |
| Backend language | Rust | 1 |
| Frontend | React + TypeScript | 1 |
| Styling | Tailwind CSS | 1 |
| Local database | SQLite | 1 |
| Vector search | sqlite-vec | 1 |
| State management | TanStack Query + Zustand | 1 |
| Full-text search | SQLite FTS5 | 1 |
| LLM integration | Pluggable (OpenAI, Anthropic, local) | 1 |
| Embeddings | nomic-embed-text (local) or API | 1 |
| Cloud sync | Custom sync service + CRDT | 2 |
| VSCode extension | TypeScript webview | 3 |
| VRM / 3D | Three.js + `@pixiv/three-vrm` | 4 |
| Character overlay | Transparent Tauri window (per-monitor) | 4 |

## Desktop Shell: Tauri 2

**Why Tauri over alternatives:**

| Criteria | Tauri 2 | Electron | Native (per-platform) |
|----------|---------|----------|----------------------|
| Binary size | ~5–15 MB | ~150+ MB | Varies |
| Memory usage | Low | High | Lowest |
| Rust backend | Yes | No (Node) | Yes (per platform) |
| Web UI | Yes | Yes | No (or separate) |
| OS hook access | Good (Rust) | Good (Node native) | Best |
| Cross-platform | Single codebase | Single codebase | 3 codebases |

See [ADR 0002](../adr/0002-use-tauri-for-desktop.md).

## Frontend: React + TypeScript

- Component ecosystem for rapid UI development
- TypeScript for type safety across frontend and shared types
- Reusable in VSCode webview (Phase 3)
- TanStack Router for type-safe routing
- TanStack Query for server-state (Tauri command calls)

## Styling: Tailwind CSS

- Utility-first for fast iteration
- Dark mode support built-in
- Consistent design tokens across routes

## Database: SQLite

**Why SQLite:**

- Embedded — no separate database server
- Cross-platform, battle-tested
- FTS5 for full-text search
- Single file — easy backup and export
- WAL mode for concurrent read/write

**Extensions:**

- `sqlite-vec` for vector similarity search
- SQLCipher for optional encryption at rest

## Vector Search: sqlite-vec

**Why sqlite-vec over LanceDB:**

- Keeps everything in one SQLite file
- Simpler deployment (no separate process)
- Adequate performance for personal-scale data (< 1M vectors)

LanceDB remains an alternative if vector search becomes a bottleneck.

## AI Layer

### LLM Provider

Pluggable adapter pattern:

```rust
trait LlmProvider {
    async fn complete(&self, messages: Vec<Message>) -> Result<String>;
    async fn stream(&self, messages: Vec<Message>) -> Result<Stream>;
}
```

Implementations: OpenAI, Anthropic, Ollama (local).

**Default:** Bring-your-own-key. No Aura-hosted LLM in MVP.

### Embeddings

| Option | Privacy | Quality | Speed |
|--------|---------|---------|-------|
| nomic-embed-text (local, via ONNX) | Full | Good | Medium |
| OpenAI text-embedding-3-small | API call | Excellent | Fast |
| Ollama local model | Full | Good | Depends on hardware |

**Default:** Local embeddings where possible. API fallback in settings.

### RAG Pipeline

1. User query → embed query
2. Vector search top-K captures
3. FTS5 search for keyword matches
4. Merge, deduplicate, rank by relevance + recency
5. Inject top results as context into LLM prompt
6. Return answer with source citations

See [AI Search](../features/ai-search.md).

## State Management

| Concern | Tool |
|---------|------|
| Server state (DB reads) | TanStack Query |
| UI state (modals, sidebar) | Zustand |
| Form state | React Hook Form |
| Persistent preferences | Tauri store plugin |

## Capture Layer (Rust)

| Capability | Crate / Approach |
|------------|-----------------|
| Clipboard | `arboard` or custom Tauri plugin |
| Global hotkeys | `tauri-plugin-global-shortcut` |
| Screenshots | `screenshots` crate |
| Active window | `active-win-pos-rs` |
| File watching | `notify` (Phase 2) |

## Sync (Phase 2)

| Component | Choice |
|-----------|--------|
| Protocol | Custom REST + WebSocket |
| Conflict resolution | CRDT (Automerge or custom) |
| Encryption | libsodium (E2E) |
| Auth | OAuth2 + device tokens |

See [Sync](sync.md).

## Development Tooling

| Tool | Purpose |
|------|---------|
| pnpm | Package manager |
| Vite | Frontend build |
| cargo | Rust build |
| sqlx or rusqlite | SQLite in Rust |
| vitest | Frontend unit tests |
| cargo test | Rust unit tests |
| GitHub Actions | CI (build all 3 platforms) |

## Alternatives Considered

### Electron

Rejected for MVP due to binary size and memory footprint. Aura runs in the background monitoring clipboard — resource efficiency matters.

### Flutter

Rejected — weaker ecosystem for OS-level hooks and no Rust integration for capture services.

### Pure Rust (egui/iced)

Rejected — slower UI iteration; web UI is more productive for complex layouts (timeline, dashboards).

### PostgreSQL

Rejected — overkill for single-user local app. SQLite is sufficient until sync requires server-side storage.

## Related Docs

- [Architecture Overview](overview.md)
- [Data Model](data-model.md)
- [Capture Pipeline](capture-pipeline.md)
- [ADR 0002](../adr/0002-use-tauri-for-desktop.md)
