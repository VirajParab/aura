import type {
  CharacterActivity,
  CharacterDefinition,
  SpawnObjectType,
  WidgetType,
} from "@/types/character";
import { SPAWN_LABELS } from "./ObjectSpawner";

export interface WidgetAction {
  widget: WidgetType;
  label: string;
  variant?: string;
}

export const WIDGET_ACTION_MAP: Record<string, WidgetType> = {
  open_quick_notes: "quick_notes",
  open_clipboard: "clipboard_history",
  open_journal: "journal",
  open_search: "ai_search",
  hologram_dashboard: "ai_search",
  open_trading_chart: "trading_chart",
  open_vault: "vault",
  fetch_note: "quick_notes",
  collect_screenshots: "clipboard_history",
};

export const SPEECH_BY_ACTION: Record<string, string> = {
  bark: "Woof! 🐕",
  nibble: "*nibble nibble* 🦝",
  wave: "Hello! ✨",
  glow: "Systems online.",
  fire_puff: "*tiny fire puff* 🔥",
  cherry_blossom_dance: "Cherry blossoms fall... 🌸",
  hologram_dashboard: "Summoning holographic dashboard...",
  fetch_note: "Fetched your note!",
  collect_screenshots: "Gathering screenshots...",
  open_vault: "Vault secured. 🐉",
};

export const CELEBRATE_ACTIVITY_MAP: Record<string, CharacterActivity> = {
  jump_wag_tail: "celebrate",
  nibble: "eat",
  cherry_blossom: "dance",
  hologram_pulse: "think",
  fire_breath: "celebrate",
};

export const INTERACTION_ACTIVITY_MAP: Record<string, CharacterActivity> = {
  bark: "wave",
  nibble: "eat",
  wave: "wave",
  glow: "think",
  fire_puff: "celebrate",
  cherry_blossom_dance: "dance",
  hologram_dashboard: "think",
  fetch_note: "celebrate",
  collect_screenshots: "peek",
  open_vault: "celebrate",
};

export const IDLE_SLEEP_ACTIVITY_MAP: Record<string, CharacterActivity> = {
  sleep_curled: "sleep",
  sleep_upside_down: "sleep",
  sleep_gentle: "sleep",
  standby_glow: "think",
  sleep_coiled: "sleep",
};

/** Alternate double-click targets per character (platform doc). */
export function getDoubleClickWidgets(character: CharacterDefinition): WidgetAction[] {
  const primary = WIDGET_ACTION_MAP[character.interactions.double_click];
  const byCharacter: Record<string, WidgetAction[]> = {
    mochi: [
      { widget: "quick_notes", label: "Quick Notes" },
      { widget: "quick_notes", label: "Today's Tasks", variant: "tasks" },
    ],
    pixel: [
      { widget: "clipboard_history", label: "Clipboard History" },
      { widget: "clipboard_history", label: "Screenshot Gallery", variant: "screenshots" },
    ],
    sakura: [
      { widget: "journal", label: "Journal" },
      { widget: "journal", label: "Reminders", variant: "reminders" },
    ],
    nova: [
      { widget: "ai_search", label: "AI Search" },
      { widget: "ai_search", label: "Memory Summary", variant: "summary" },
    ],
    ember: [
      { widget: "trading_chart", label: "Trading Chart" },
      { widget: "vault", label: "Vault Guard" },
    ],
  };

  return (
    byCharacter[character.id] ??
    (primary ? [{ widget: primary, label: character.name }] : [])
  );
}

export function spawnForInteraction(
  character: CharacterDefinition,
  level: "single" | "double" | "long_press" | "feed_treat",
  action?: string,
): SpawnObjectType[] {
  const spawns = character.spawn_objects;

  if (level === "feed_treat") {
    if (character.id === "mochi") return ["sticky_note"];
    return spawns.slice(0, 1);
  }

  if (level === "double") {
    const map: Record<string, SpawnObjectType[]> = {
      mochi: ["sticky_note"],
      pixel: ["memory_orb"],
      sakura: ["mini_calendar"],
      nova: ["memory_orb"],
      ember: ["chart_board"],
    };
    return map[character.id] ?? spawns.slice(0, 1);
  }

  if (level === "long_press") {
    const map: Record<string, SpawnObjectType[]> = {
      mochi: ["sticky_note", "task_card"],
      pixel: ["memory_orb"],
      sakura: ["sticky_note", "mini_calendar"],
      nova: ["memory_orb", "terminal_screen"],
      ember: ["treasure_chest", "chart_board"],
    };
    if (action === "open_vault") return ["treasure_chest"];
    if (action === "collect_screenshots") return ["memory_orb"];
    if (action === "hologram_dashboard") return ["terminal_screen", "memory_orb"];
    return map[character.id] ?? spawns;
  }

  if (level === "single" && character.special_tricks.includes("bring_note_in_mouth")) {
    return Math.random() < 0.2 ? ["sticky_note"] : [];
  }

  return [];
}

export function spawnPayload(
  type: SpawnObjectType,
  character: CharacterDefinition,
  variant?: string,
): Record<string, unknown> {
  const themed: Record<SpawnObjectType, Record<string, unknown>> = {
    sticky_note: {
      label: SPAWN_LABELS.sticky_note,
      text: `${character.name} brought you a note!`,
      color: character.color,
    },
    task_card: {
      label: SPAWN_LABELS.task_card,
      text: "Review your tasks today",
      color: character.color,
    },
    mini_calendar: {
      label: SPAWN_LABELS.mini_calendar,
      text: "Today's schedule",
      color: character.color,
    },
    memory_orb: {
      label: SPAWN_LABELS.memory_orb,
      text:
        character.id === "pixel"
          ? "Recent screenshots & clips"
          : "Recent memories glow here",
      color: character.color,
    },
    treasure_chest: {
      label: SPAWN_LABELS.treasure_chest,
      text: "Achievement unlocked!",
      color: character.color,
    },
    chart_board: {
      label: SPAWN_LABELS.chart_board,
      text: "Trading journal snapshot",
      color: character.color,
    },
    terminal_screen: {
      label: SPAWN_LABELS.terminal_screen,
      text: "dev@aura:~$ hologram active",
      color: character.color,
    },
  };

  const base = themed[type];
  if (variant) return { ...base, variant };
  return base;
}

export function characterEffectType(
  character: CharacterDefinition,
  activity: string,
): "cherry_blossom" | "hologram" | "fire" | "none" {
  if (
    character.id === "sakura" &&
    (activity === "dance" || character.behaviors.celebrate === "cherry_blossom")
  ) {
    return "cherry_blossom";
  }
  if (
    character.id === "nova" &&
    ["think", "celebrate"].includes(activity)
  ) {
    return "hologram";
  }
  if (
    character.id === "ember" &&
    ["celebrate", "eat"].includes(activity)
  ) {
    return "fire";
  }
  return "none";
}

export function usesUpsideDownSleep(character: CharacterDefinition): boolean {
  return (
    character.behaviors.idle_sleep === "sleep_upside_down" ||
    character.special_tricks.includes("sleep_upside_down")
  );
}

export function usesFloatIdle(character: CharacterDefinition): boolean {
  return character.id === "sakura" || character.special_tricks.includes("dance");
}

export type CompanionMenuAction =
  | {
      id: string;
      label: string;
      emoji: string;
      kind: "activity";
      activity: CharacterActivity;
    }
  | {
      id: string;
      label: string;
      emoji: string;
      kind: "spawn";
      spawnType: SpawnObjectType;
    }
  | {
      id: string;
      label: string;
      emoji: string;
      kind: "widget";
      widget: WidgetType;
      variant?: string;
    };

const SPAWN_EMOJI: Record<SpawnObjectType, string> = {
  sticky_note: "📝",
  task_card: "✅",
  mini_calendar: "📅",
  memory_orb: "🔮",
  treasure_chest: "🎁",
  chart_board: "📈",
  terminal_screen: "💻",
};

const ACTIVITY_MENU: {
  activity: CharacterActivity;
  label: string;
  emoji: string;
}[] = [
  { activity: "sit", label: "Sit", emoji: "🪑" },
  { activity: "walk", label: "Walk", emoji: "🐾" },
  { activity: "run", label: "Run", emoji: "💨" },
  { activity: "sleep", label: "Sleep", emoji: "😴" },
  { activity: "wave", label: "Wave", emoji: "👋" },
  { activity: "dance", label: "Dance", emoji: "💃" },
  { activity: "jump", label: "Jump", emoji: "⬆️" },
  { activity: "look_around", label: "Look around", emoji: "👀" },
  { activity: "celebrate", label: "Celebrate", emoji: "🎉" },
  { activity: "think", label: "Think", emoji: "💭" },
  { activity: "eat", label: "Eat", emoji: "🦴" },
  { activity: "peek", label: "Peek", emoji: "🫣" },
];

const AMBIENT_TO_ACTIVITY: Record<string, CharacterActivity> = {
  sit: "sit",
  look_around: "look_around",
  follow_cursor: "follow_cursor",
  sleep: "sleep",
  dance: "dance",
};

/** Actions shown in the long-press companion menu. */
export function getCompanionMenuActions(
  character: CharacterDefinition,
): CompanionMenuAction[] {
  const actions: CompanionMenuAction[] = [];
  const seen = new Set<string>();

  const push = (action: CompanionMenuAction) => {
    if (seen.has(action.id)) return;
    seen.add(action.id);
    actions.push(action);
  };

  for (const ambient of character.behaviors.ambient) {
    const activity = AMBIENT_TO_ACTIVITY[ambient];
    if (!activity) continue;
    const preset = ACTIVITY_MENU.find((a) => a.activity === activity);
    push({
      id: `activity-${activity}`,
      kind: "activity",
      activity,
      label: preset?.label ?? activity.replace(/_/g, " "),
      emoji: preset?.emoji ?? "✨",
    });
  }

  for (const item of ACTIVITY_MENU) {
    push({
      id: `activity-${item.activity}`,
      kind: "activity",
      activity: item.activity,
      label: item.label,
      emoji: item.emoji,
    });
  }

  for (const spawnType of character.spawn_objects) {
    push({
      id: `spawn-${spawnType}`,
      kind: "spawn",
      spawnType,
      label: SPAWN_LABELS[spawnType],
      emoji: SPAWN_EMOJI[spawnType],
    });
  }

  for (const w of getDoubleClickWidgets(character)) {
    push({
      id: `widget-${w.widget}-${w.variant ?? "default"}`,
      kind: "widget",
      widget: w.widget,
      variant: w.variant,
      label: w.label,
      emoji: "📂",
    });
  }

  const longWidget = WIDGET_ACTION_MAP[character.interactions.long_press];
  if (longWidget) {
    const label =
      character.interactions.long_press === "fetch_note"
        ? "Fetch note"
        : character.interactions.long_press.replace(/_/g, " ");
    push({
      id: `widget-long-${longWidget}`,
      kind: "widget",
      widget: longWidget,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      emoji: "⭐",
    });
  }

  return actions;
}
