export type CharacterCategory =
  | "cute_animals"
  | "anime_companions"
  | "cartoon_characters"
  | "high_tech_ai"
  | "fantasy_mythology";

export type CharacterActivity =
  | "sit"
  | "sleep"
  | "walk"
  | "run"
  | "jump"
  | "wave"
  | "dance"
  | "fall"
  | "roll"
  | "look_around"
  | "follow_cursor"
  | "celebrate"
  | "cry"
  | "think"
  | "read"
  | "eat"
  | "stretch"
  | "hide"
  | "peek"
  | "idle";

export type SpawnObjectType =
  | "sticky_note"
  | "task_card"
  | "mini_calendar"
  | "memory_orb"
  | "treasure_chest"
  | "chart_board"
  | "terminal_screen";

export type WidgetType =
  | "quick_notes"
  | "clipboard_history"
  | "journal"
  | "ai_search"
  | "trading_chart"
  | "vault";

export interface CharacterBehaviors {
  ambient: string[];
  idle_sleep: string;
  celebrate: string;
  follow_cursor: boolean;
  multi_monitor_chase: boolean;
}

export interface CharacterInteractions {
  single_click: string;
  double_click: string;
  long_press: string;
}

export interface WindowPhysicsConfig {
  preferred_anchors: string[];
  can_hang: boolean;
  can_hide_behind: boolean;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  category: CharacterCategory;
  emoji: string;
  model: string;
  scale: number;
  color: string;
  personality_prompt: string;
  behaviors: CharacterBehaviors;
  interactions: CharacterInteractions;
  spawn_objects: SpawnObjectType[];
  special_tricks: string[];
  window_physics: WindowPhysicsConfig;
  widget: WidgetType;
}

export interface CharacterManifest {
  version: string;
  launch_lineup: string[];
  characters: CharacterDefinition[];
}

export interface SpawnableObject {
  id: string;
  type: SpawnObjectType;
  position: { x: number; y: number };
  /** Offset from anchor — when anchor is "character", relative to companion feet */
  anchor: "desktop" | "window" | "character";
  payload: Record<string, unknown>;
  character_id: string;
  expires_at?: string;
}

export interface AppSettings {
  active_character_id: string;
  companion_enabled: boolean;
  companion_opacity: number;
  /** Multiplier applied on top of each character's manifest scale */
  companion_scale: number;
  /** Horizontal anchor as % of screen width (0–100) */
  position_x_percent: number;
  /** Vertical anchor as % of screen height (0–100) */
  position_y_percent: number;
  reduce_motion: boolean;
  follow_cursor: boolean;
  /** Play walk/run when moving to a target */
  locomotion_enabled: boolean;
  /** Gentle idle bobbing at rest */
  idle_bob: boolean;
  /** Movement speed in px/s */
  move_speed: number;
}

export interface MonitorInfo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scale_factor: number;
  is_primary: boolean;
}

export interface CharacterScreenPosition {
  x: number;
  y: number;
}

export type InteractionLevel = "single" | "double" | "long_press";

export interface InteractionEvent {
  level: InteractionLevel;
  action: string;
  characterId: string;
  screenPosition: CharacterScreenPosition;
}
