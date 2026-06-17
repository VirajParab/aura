# Focus Mode

**Phase 3**

The companion becomes a coach — enforcing boundaries during deep work and trading sessions.

## Overview

Focus Mode uses active app detection and user-defined rules to help maintain discipline. During deep work, Aura suggests breaks. During trading, Aura enforces loss limits and plan adherence.

## User Stories

1. As a developer, I want a reminder to take a break after 90 minutes of coding
2. As a trader, I want Aura to tell me to stop after hitting my loss limit
3. As a user, I want to start a focused work session with a timer
4. As a trader, I want the choice to end my session or continue when warned
5. As a user, I want focus mode to minimize distractions (hide non-essential UI)

## Modes

### Deep Work Mode

**Trigger:** User starts focus session, or Aura detects sustained IDE usage.

```
Aura notices:
  VSCode active
  90 minutes elapsed

Companion says:
  "Time for a break. You've been coding for 90 minutes."

  [Take Break]  [Keep Going]  [End Session]
```

**Detection:**

| Signal | Source |
|--------|--------|
| Active app | OS window focus API |
| Duration | Timer from first IDE focus |
| Break taken | User clicks "Take Break" — resets timer |
| IDE apps | VSCode, IntelliJ, Vim, Terminal (configurable) |

**Break suggestions:**

- 5-minute break after 90 minutes (Pomodoro-style, configurable)
- Stretch reminder
- Optional: block distracting apps during focus (future)

### Trading Mode

**Trigger:** User opens trading dashboard or trading app detected.

```
Aura sees:
  Loss #2 today
  Daily limit: 3 losses

Companion says:
  "Your plan says stop after 3 losses. This is loss #2."

  [End Session]  [Continue Anyway]
```

**Enforcement rules (configurable in Settings):**

| Rule | Default | Action |
|------|---------|--------|
| Daily loss limit | -₹5,000 | Warning at 80%, block at 100% |
| Max losses per day | 3 | Warning at N-1, block at N |
| Max trades per day | 10 | Warning at 8, block at 10 |
| Trading hours | 9:00–15:30 | Block outside hours |
| Cooldown after loss | 15 min | Suggest waiting |

**On block (Phase 3 with Companion):**

- Trading dashboard overlay with companion in Warning state
- "Continue Anyway" requires typing confirmation phrase
- Session end logged in timeline

## UX

### Starting Focus Mode

```
┌────────────────────────┐
│ Start Focus Session    │
├────────────────────────┤
│ Mode:  [Deep Work  ▼]  │
│        [Trading       ] │
│                        │
│ Duration: [90 min  ▼]  │
│                        │
│ [Start]  [Cancel]      │
└────────────────────────┘
```

Or: auto-detected when IDE/trading app becomes active (if enabled in Settings).

### Active Session Indicator

```
┌──────────────────────────────────────┐
│  🎯 Focus: Deep Work · 47 min left  │
└──────────────────────────────────────┘
```

Shown in system tray and app header.

### Session Summary (on end)

```
┌──────────────────────────────────────────────────┐
│  Focus Session Complete                          │
├──────────────────────────────────────────────────┤
│  Mode: Deep Work                                 │
│  Duration: 90 minutes                            │
│  App: VSCode (Sentinel project)                  │
│  Captures during session: 4                      │
│  Breaks taken: 1                                   │
└──────────────────────────────────────────────────┘
```

Logged as timeline events.

## Data Entities

```json
// focus_sessions table (Phase 3)
{
    "id": "uuid",
    "mode": "deep_work",        // deep_work | trading
    "started_at": "ISO 8601",
    "ended_at": "ISO 8601",
    "duration_minutes": 90,
    "primary_app": "Code",
    "breaks_taken": 1,
    "rules_triggered": ["break_reminder_90min"],
    "ended_by": "user"           // user | auto | rule_block
}
```

## AI Behavior

- Coaching messages reference user's historical patterns
- *"You tend to make mistakes after 3+ hours of coding"*
- Session summaries included in daily timeline review

## Phase

| Capability | Phase |
|------------|-------|
| Deep work timer (manual) | 3 |
| Active app detection | 3 |
| Break reminders | 3 |
| Trading rule enforcement | 3 |
| Dashboard block with companion | 3 |
| Auto-detect focus from app | 3 |
| Distraction blocking | Future |

## Open Questions

- Should "Continue Anyway" be logged and shown in trading review?
- Pomodoro intervals (25/5) as an option?
- Integration with OS Do Not Disturb?
- Focus mode statistics dashboard?

## Related Docs

- [Companion Layer](companion-layer.md)
- [Trading Workspace](trading-workspace.md)
- [Timeline](timeline.md)
