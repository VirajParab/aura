# ADR 0002: Use Tauri for Cross-Platform Desktop

## Status

Accepted

## Context

AuraOS requires a cross-platform desktop application (Linux, macOS, Windows) with:

- Global hotkeys (`Ctrl+Shift+A`, `Ctrl+K`)
- Background clipboard monitoring
- Screenshot capture
- Small install footprint and low resource usage
- Rust-friendly OS integration for capture hooks

Alternatives considered:

| Option | Pros | Cons |
|--------|------|------|
| **Tauri 2** | Small binary, Rust backend, web UI, active ecosystem | Newer than Electron, some platform quirks |
| **Electron** | Mature, huge ecosystem | Large binary, higher memory use |
| **Native per-platform** | Best OS integration | 3x development cost for capture, UI, sync |

## Decision

Use **Tauri 2** with a **React + TypeScript** frontend for the AuraOS desktop application.

Rust handles capture services, database access, and OS hooks. The web frontend handles UI, search, and AI chat surfaces.

## Consequences

**Positive:**

- Single codebase for all three platforms
- Rust is well-suited for clipboard/screenshot hooks and SQLite
- Small binary size supports "always running" background capture
- Frontend can be reused in VSCode webview (Phase 3)

**Negative:**

- Team needs Rust + TypeScript skills
- Some Tauri plugins may need custom development for clipboard monitoring
- Platform-specific testing required on all three OSes

## References

- [Tech Stack](../architecture/tech-stack.md)
- [Architecture Overview](../architecture/overview.md)
