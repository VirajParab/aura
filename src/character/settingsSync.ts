import type { AppSettings } from "@/types/character";

const SYNC_KEYS: (keyof AppSettings)[] = [
  "active_character_id",
  "companion_enabled",
  "companion_opacity",
  "companion_scale",
  "position_x_percent",
  "position_y_percent",
  "reduce_motion",
  "follow_cursor",
  "locomotion_enabled",
  "idle_bob",
  "move_speed",
];

export function settingsSnapshot(settings: AppSettings): string {
  return JSON.stringify(SYNC_KEYS.map((key) => settings[key]));
}

export function settingsDiffer(a: AppSettings, b: AppSettings): boolean {
  return settingsSnapshot(a) !== settingsSnapshot(b);
}
