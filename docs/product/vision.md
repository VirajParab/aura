# AuraOS Product Vision

## One-Liner

**AuraOS** — Your AI Companion + Second Brain + Activity Memory.

## Problem Statement

Modern knowledge workers and traders juggle fragmented tools:

- **Notion / Obsidian** for notes
- **Chrome History** for browsing memory
- **Trading journals** that are tedious to maintain
- **Sticky notes** and random text files
- **Password managers** and bookmark folders
- **IDE history** and lost terminal commands

Nothing connects these. Context is lost. You can't ask: *"What was I doing when I figured out that bug?"*

AuraOS replaces the morning ritual of opening five apps with one surface that already knows your yesterday and prepares your today.

## Morning Briefing UX

Imagine waking up and opening your laptop. Instead of hunting across apps, you open Aura.

**Aura already knows:**

### Yesterday

- Worked on Sentinel Rule Engine
- Traded Gold +₹4,800
- Saved 3 architecture screenshots
- Copied AWS deployment commands

### Today

- Finish Clover aggregation
- Journal trading session
- Review failed trades

This briefing is not manually curated — it is synthesized from the [Memory Timeline](../features/timeline.md).

## Core Product Areas

### 1. Companion Layer

The visible character is not cosmetic. It is the emotional interface to your digital memory.

**States:** Idle, Thinking, Coding, Trading, Meeting, Sleeping, Celebrating, Warning

**Examples:**

| Event | Companion Reaction |
|-------|-------------------|
| Compilation fails | Looks disappointed |
| Trade hits target | Celebrates |
| Daily loss reached | Blocks trading dashboard |

See [Companion Layer](../features/companion-layer.md) for full spec.

### 2. Universal Capture System

The most important ingestion feature. Everything enters Aura automatically or with a single keystroke.

**Sources:** Clipboard, screenshots, voice notes, documents, browser highlights, emails, code snippets, trading data

**UX:** Press `Ctrl+Shift+A` → pick type → saved in ~1 second.

See [Universal Capture](../features/universal-capture.md).

### 3. Smart Clipboard Timeline

Every copy operation is remembered and searchable.

```
Today
  docker compose up
  aws eks update-kubeconfig
  Gold breakout strategy
  Client feedback message

Yesterday
  SQL migration query
  Sentinel API endpoint
```

Search: *"show command copied last week"*

See [Clipboard Timeline](../features/clipboard-timeline.md).

### 4. Trading Workspace

A first-class module — not an afterthought. Most trading journals suck because entry friction is too high.

**Dashboard:** Win rate, profit factor, rule adherence, daily limit violations

**Post-trade popup:** Instrument, direction, entry, loss, emotion, screenshot — 10 seconds total.

**End-of-day AI review:** Mistakes, patterns, suggested improvements.

See [Trading Workspace](../features/trading-workspace.md).

### 5. Developer Workspace

Your coding memory across projects.

**Per-project hub:** Notes, architecture, tasks, code snippets, screenshots, decisions

**Decision memory:**

> May 22 — Decided: Use Postgres Aggregates. Reason: Performance.

Later: *"Why did we use aggregates?"* — Aura answers.

See [Developer Workspace](../features/developer-workspace.md).

### 6. Knowledge Graph

Captures become connected automatically.

**Example:** You save "Clover API", "Fraud Rule", "Tip > Bill" — Aura links them.

```
Sentinel
  |
  ├ Clover
  |
  ├ Fraud Engine
  |
  └ Rule Aggregates
```

See [Knowledge Graph](../features/knowledge-graph.md).

### 7. Memory Timeline

**The killer feature.** Your digital life becomes a searchable chronological log.

```
09:12  Copied AWS Command
10:32  Gold Trade +1200
11:00  Screenshot Saved
12:05  Meeting Notes
13:40  Created Sentinel Rule
```

See [Timeline](../features/timeline.md).

### 8. Focus Mode

The companion becomes a coach during deep work and trading sessions.

**Deep Work:** VSCode active for 90 minutes → "Time for a break."

**Trading Mode:** Loss #2 → "Your plan says stop." → End Session / Continue Anyway

See [Focus Mode](../features/focus-mode.md).

### 9. AI Search

Instead of folders, ask natural-language questions:

- *"Show all Gold trades where I felt fear."*
- *"What AWS commands did I use for Sentinel deployment?"*
- *"Find architecture screenshot from April."*

See [AI Search](../features/ai-search.md).

### 10. Command Palette

Like Cursor. `Ctrl+K` to search everything: notes, trades, files, clipboard, or Ask Aura.

See [Command Palette](../features/command-palette.md).

## The Bet

> Not the character. Not the AI. Not the trading journal.
>
> **The Timeline.**

Imagine asking:

*"What was I doing on May 21 when I discovered the Clover rate-limit issue?"*

Aura shows:

- Terminal command
- Screenshot
- Note
- Git commit
- Trade journal entry
- Browser page

That is something Notion, Obsidian, and most AI note apps still don't do well. If we nail the "memory of your digital life" experience, the companion becomes the natural interface to it.

## Companion Philosophy

The companion is the **interface**, not the product.

- Users don't open Aura to see a cute character
- They open Aura to remember, capture, and act
- The character reacts to their life, making memory feel alive
- Phase 1: VRM characters with physics — **characters become the UI** (ship first)
- Phase 2: Memory platform — capture, timeline, workspaces
- Phase 3: Intelligent coaching, integrations, event-driven reactions

**Platform vision:** Think of Aura as a platform where characters are the interface to your second brain. Mochi brings notes. Nova projects holographic search. Ember guards your vault. Five launch characters cover every audience: animals, anime, AI, fantasy.

See [Character Platform](../features/character-platform.md) and [Character Roster](character-roster.md).

## Platform & Data Strategy

| Decision | Choice |
|----------|--------|
| Platform | Cross-platform from day one (Linux, macOS, Windows) |
| Data | Hybrid — local SQLite from Phase 1 (config), full memory in Phase 2, optional cloud sync in Phase 2 |

## Related Docs

- [Roadmap](roadmap.md) — Phased delivery
- [MVP](mvp.md) — 3-month scope
- [Navigation](navigation.md) — App structure
- [Architecture Overview](../architecture/overview.md)
