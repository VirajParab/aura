# Trading Workspace

**Phase 2**

A first-class trading journal with low-friction entry, meaningful metrics, and AI-powered review.

## Overview

Most trading journals fail because entry friction is too high. Aura's Trading Workspace targets a 10-second post-trade log, a dashboard with the metrics that matter, and an end-of-day AI analysis that surfaces patterns you'd miss.

## User Stories

1. As a trader, I want to log a trade in under 10 seconds after it closes
2. As a trader, I want to see my win rate, profit factor, and rule adherence at a glance
3. As a trader, I want AI to review my day and highlight mistakes
4. As a trader, I want to track emotions and see how they correlate with outcomes
5. As a trader, I want Aura to stop me when I hit my daily loss limit

## UX

### Trading Dashboard

```
┌──────────────────────────────────────────────────┐
│  Trading Dashboard                    May 2026   │
├──────────────────────────────────────────────────┤
│                                                    │
│  Win Rate        Profit Factor    Rule Adherence  │
│  ┌────────┐      ┌────────┐      ┌────────┐      │
│  │  62%   │      │  2.1   │      │  89%   │      │
│  └────────┘      └────────┘      └────────┘      │
│                                                    │
│  Daily Limit Violations: 2                        │
│  Today's P&L: +₹4,800                            │
│                                                    │
├──────────────────────────────────────────────────┤
│  Recent Trades                                     │
│                                                    │
│  10:32  Gold Long    +₹1,200   Confidence        │
│  11:45  Gold Short   -₹800     Fear              │
│  14:20  Silver Long  +₹2,400   Confidence        │
│  15:10  Gold Long    +₹2,000   Greed             │
│  16:30  Gold Long    -₹1,000   Fear              │
│                                                    │
└──────────────────────────────────────────────────┘
```

### Post-Trade Entry Popup

Triggered manually (`Ctrl+Shift+A` → Trade) or via prompt after trade session.

```
┌────────────────────────┐
│ Log Trade              │
├────────────────────────┤
│ Instrument? [Gold   ▼] │
│ Direction?  [Long   ▼] │
│ Entry?      [2345.50 ] │
│ Exit?       [2350.00 ] │
│ P&L?        [+4800   ] │
│ Emotion?    [● Fear     ] │
│             [○ Greed    ] │
│             [○ Confidence] │
│ Screenshot? [📸 Attach ] │
│ Rules followed? [✓]    │
│ Notes?      [          ] │
│                        │
│ [Save]  [Skip]         │
└────────────────────────┘
```

**Target:** 10 seconds from popup to save.

### End-of-Day AI Review

```
┌──────────────────────────────────────────────────┐
│  Today's Analysis — May 21, 2026                  │
├──────────────────────────────────────────────────┤
│                                                    │
│  5 Trades · 3 Winners · 2 Losers · P&L: +₹4,800 │
│                                                    │
│  Mistakes:                                         │
│  • Entered early twice (10:32, 15:10)             │
│  • Ignored trend once (11:45 short against trend) │
│                                                    │
│  Patterns:                                         │
│  • Fear-correlated trades had 0% win rate today   │
│  • Confidence trades: 3/3 winners                   │
│                                                    │
│  Suggested Improvement:                            │
│  Wait for confirmation candle before entry.        │
│                                                    │
│  [View Timeline]  [View All Trades]                │
└──────────────────────────────────────────────────┘
```

## Data Entities

Trades stored as `captures` with `type = 'trade'`:

```json
{
    "instrument": "Gold",
    "direction": "long",
    "entry_price": 2345.50,
    "exit_price": 2350.00,
    "pnl": 4800,
    "currency": "INR",
    "emotion": "confidence",
    "screenshot_id": "uuid",
    "rules_followed": true,
    "notes": "Breakout above resistance"
}
```

Each trade creates a `TimelineEvent` with `event_type = 'trade'`.

See [Data Model](../architecture/data-model.md).

## Metrics

| Metric | Calculation |
|--------|-------------|
| Win Rate | Winning trades / Total trades |
| Profit Factor | Gross profit / Gross loss |
| Rule Adherence | Trades with `rules_followed = true` / Total |
| Daily Limit Violations | Days where loss exceeded configured limit |
| Emotion Correlation | Win rate grouped by emotion tag |

### Configurable Rules (Settings)

- Daily loss limit (e.g., -₹5,000)
- Max trades per day
- Allowed instruments
- Trading hours window

## AI Behavior

### End-of-Day Review

1. Fetch all trades for the day
2. Cross-reference with timeline events (screenshots, notes during session)
3. LLM analyzes patterns: timing, emotion correlation, rule violations
4. Generate structured review with mistakes, patterns, and suggestions

### Query Examples

- *"Show all Gold trades where I felt fear"*
- *"What's my win rate on confidence trades this month?"*
- *"When did I last violate my daily loss limit?"*

## Companion Integration (Phase 3)

| Event | Companion Action |
|-------|-----------------|
| Trade hits target | Celebrating state |
| Daily loss reached | Warning state — blocks trading dashboard |
| 3 losses in a row | Focus mode prompt: "Your plan says stop" |

See [Companion Layer](companion-layer.md) and [Focus Mode](focus-mode.md).

## Phase

| Capability | Phase |
|------------|-------|
| Trade capture via universal capture | 2 |
| Trading dashboard | 2 |
| Metrics calculation | 2 |
| End-of-day AI review | 2 |
| Daily loss enforcement | 3 |
| Broker API integration | Future |
| Companion reactions | 3 |

## Open Questions

- Broker API integration (Zerodha, Interactive Brokers) — manual only for now?
- Multi-account support?
- Currency handling for international instruments?
- Import from existing trading journal (CSV)?
- Chart screenshot auto-attach from trading platform?

## Related Docs

- [Universal Capture](universal-capture.md)
- [Timeline](timeline.md)
- [AI Search](ai-search.md)
- [Focus Mode](focus-mode.md)
- [Companion Layer](companion-layer.md)
