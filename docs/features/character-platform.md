# Character Platform

**Phase 1 — Characters as UI**

Think of Aura as a platform where **characters become the UI for your second brain**.

The companion is not decoration. Each character is a living interface to memory — notes, tasks, clipboard, trading, vault — expressed through personality, physics, and interaction. Users don't navigate folders; they interact with a character that knows their life.

## Platform Vision

```
┌─────────────────────────────────────────────────────────┐
│  Traditional Second Brain          Aura Character UI     │
├─────────────────────────────────────────────────────────┤
│  Sidebar → Notes                   Mochi brings note     │
│  Search bar → Query                Nova projects hologram│
│  Dashboard → Stats                 Ember guards vault    │
│  Clipboard app → History           Pixel climbs to clip  │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Character = Interface** — Every core Aura feature maps to a character interaction
2. **Audience diversity** — First 5–10 characters cover completely different audiences
3. **Shared framework** — All characters use the same animation, physics, and interaction engine
4. **Unique personality** — Behavior, tricks, and spawn objects differentiate each character
5. **Memory-first** — Characters surface timeline data; they don't replace search, they embody it

## Character → Feature Mapping

| Aura Feature | Default Interaction | Example Character |
|--------------|--------------------|--------------------|
| Quick Notes | Single click | Mochi brings note in mouth |
| Today's Tasks | Double click | Mochi fetches task list |
| Clipboard History | Single/double click | Pixel opens clipboard |
| Screenshots | Character collects | Pixel gathers screenshots |
| AI Search | Double click | Nova hologram search |
| Trading Journal | Double click | Ember chart board |
| Vault / Secrets | Long press | Ember breathes fire, opens vault |
| Focus Mode | Long press | Hanuman motivational coach |
| Project Memory | Double click | Yuki holograms near VS Code |
| Achievements | Spawn object | Treasure chest appears |

## Launch Lineup

Five characters at launch, one per audience segment:

| Character | Category | Audience | Primary Role |
|-----------|----------|----------|--------------|
| 🐕 **Mochi** | Cute Animals | Everyone — highest retention | Quick notes, tasks, daily companion |
| 🦝 **Pixel** | Cute Animals | Casual users, visual collectors | Clipboard, screenshots |
| 🌸 **Sakura** | Anime | Journalers, emotional trackers | Journal, reminders, gentle coaching |
| 🤖 **Nova** | High-Tech AI | Professionals, power users | Search, summaries, holographic UI |
| 🐉 **Ember** | Fantasy | Traders, security-conscious | Vault guard, trading charts |

Full character specs: [Character Roster](../product/character-roster.md)

## Audience Categories

The first 10 characters should cover five distinct audiences. See [Character Roster](../product/character-roster.md) for full specs.

| Category | Retention Profile | Examples |
|----------|------------------|----------|
| 🐾 Cute Animals | Highest — runs all day | Mochi, Pixel, Nibbles |
| 🌸 Anime Companions | Massive market | Sakura, Yuki, Akira |
| 🎨 Cartoon Characters | Virality drivers | Chiku, Bobo |
| 🤖 High-Tech AI | Premium users | Nova, Jarv, Orb |
| ⚔️ Fantasy & Mythology | Strong in India + global | Ganesha, Hanuman, Ember |

## Interaction Model

Every character supports three interaction levels. See [Character Physics](character-physics.md).

| Level | Input | Result |
|-------|-------|--------|
| **Single click** | Tap character | Mini reaction (bark, wave, glow) |
| **Double click** | Double tap | Open contextual Aura widget |
| **Long press** | Hold 800ms+ | Special ability / premium action |

### Interaction Examples

| Character | Single Click | Double Click | Long Press |
|-----------|-------------|--------------|------------|
| Mochi (Shiba) | Bark + tail wag | Open Quick Notes | Fetch note from timeline |
| Sakura | Wave + blush | Open journal | Cherry blossom dance |
| Nova | Glow pulse | AI search hologram | Full dashboard projection |
| Ember | Tiny fire puff | Trading chart board | Open vault |
| Pixel | Nibble animation | Clipboard history | Screenshot gallery |

## Spawnable Objects

Characters create useful desktop objects — not just animations. See [Character Physics](character-physics.md#spawnable-objects).

| Object | Feature | Thrown By |
|--------|---------|-----------|
| Sticky Note | Quick capture | Mochi, Chiku |
| Task Card | Reminders | Mochi, Akira |
| Mini Calendar | Schedule | Sakura |
| Memory Orb | Recent notes | Nova, Orb |
| Treasure Chest | Achievements | Akira, Ember |
| Chart Board | Trading journal | Ember |
| Terminal Screen | Dev tools | Yuki, Jarv |

## Technical Architecture

```
┌─────────────────────────────────────────────────┐
│  Character Engine (see character-engine.md)      │
├─────────────────────────────────────────────────┤
│  VRM Renderer │ Physics │ Window Anchor │ Input  │
├─────────────────────────────────────────────────┤
│  Animation State Machine (shared framework)      │
├─────────────────────────────────────────────────┤
│  Character Definition (per-character JSON/VRM)   │
│  Mochi.vrm │ Sakura.vrm │ Nova.vrm │ ...        │
├─────────────────────────────────────────────────┤
│  Aura Core — Timeline, Capture, Search, Vault    │
└─────────────────────────────────────────────────┘
```

See [Character Engine](../architecture/character-engine.md).

## Marketplace (Phase 1+)

Community creators publish character packs:

- VRM model + animation set
- Personality prompt (LLM tone)
- Interaction bindings (which widget opens on double-click)
- Spawn object themes
- Optional premium pricing

Aura takes a platform cut. Original launch characters ship free.

## Phase Breakdown

| Capability | Phase 1 | Phase 2 | Phase 3 |
|------------|---------|---------|---------|
| VRM rendering + physics | ✓ | | |
| Launch lineup (5 characters) | ✓ | | |
| 3-level click interactions | ✓ | | |
| Spawnable objects | ✓ | | |
| Widgets wired to real data | | ✓ | |
| Event-driven reactions | | | ✓ |
| Character expansion (6–10) | | | ✓ |
| Personality marketplace | ✓ | | |

## Success Metrics

| Metric | Target |
|--------|--------|
| Daily active companion time | > 4 hours (Mochi/Pixel tier) |
| Interaction rate | > 10 clicks/day per active user |
| Character switch rate | < 20% after first week (retention) |
| Feature access via character | > 40% of note/task opens via double-click |

## Open Questions

- Free vs premium characters at launch?
- User-uploaded VRM support at marketplace launch?
- Per-monitor character instances or single character across all displays?
- TTS voice per character personality?
- Character reactions to real system events (CPU, battery) — always on or opt-in?

## Related Docs

- [Character Roster](../product/character-roster.md) — All character specs
- [Character Physics](character-physics.md) — Animation framework, window physics
- [Character Engine](../architecture/character-engine.md) — VRM rendering, technical design
- [Companion Layer](companion-layer.md) — State machine, coaching
- [Vision](../product/vision.md) — Companion philosophy
