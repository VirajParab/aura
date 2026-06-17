import type { AppSettings, CharacterScreenPosition } from "@/types/character";

/** On-screen height in px at companion_scale 1.0 and definition scale 1.0 */
export const CHARACTER_PIXEL_HEIGHT = 120;

export const MIN_COMPANION_SCALE = 0.5;
export const MAX_COMPANION_SCALE = 10;
export const DEFAULT_COMPANION_SCALE = 3;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  active_character_id: "mochi",
  companion_enabled: true,
  companion_opacity: 0.95,
  companion_scale: DEFAULT_COMPANION_SCALE,
  position_x_percent: 50,
  position_y_percent: 88,
  reduce_motion: false,
  follow_cursor: true,
  locomotion_enabled: true,
  idle_bob: true,
  move_speed: 120,
};

export function mergeSettings(partial: Partial<AppSettings> | null | undefined): AppSettings {
  const merged = { ...DEFAULT_APP_SETTINGS, ...partial };
  merged.companion_scale = clampCompanionScale(merged.companion_scale);
  return merged;
}

export function clampCompanionScale(scale: number): number {
  if (!Number.isFinite(scale)) return DEFAULT_COMPANION_SCALE;
  return Math.min(MAX_COMPANION_SCALE, Math.max(MIN_COMPANION_SCALE, scale));
}

export function percentToPosition(
  xPercent: number,
  yPercent: number,
  width: number,
  height: number,
): CharacterScreenPosition {
  return {
    x: (xPercent / 100) * width,
    y: (yPercent / 100) * height,
  };
}

/** Multiplier applied to pixel-sized mesh geometry (not the scene root). */
export function meshScaleMultiplier(
  definitionScale: number,
  companionScale: number,
): number {
  return definitionScale * clampCompanionScale(companionScale);
}

export function characterHeightPx(
  definitionScale: number,
  companionScale: number,
): number {
  return CHARACTER_PIXEL_HEIGHT * meshScaleMultiplier(definitionScale, companionScale);
}

export function visualHitRadiusPx(
  definitionScale: number,
  companionScale: number,
): number {
  return characterHeightPx(definitionScale, companionScale) * 0.45;
}

export function motionReduced(settings: AppSettings): boolean {
  return settings.reduce_motion;
}

/** Geometry unit → pixels for placeholder meshes (~1.35 unit tall at scale 1). */
export function geometryUnitToPixels(): number {
  return CHARACTER_PIXEL_HEIGHT / 1.35;
}

/** Scale factor for VRM models (roughly humanoid height in VRM units). */
export function vrmBasePixelScale(definitionScale: number, companionScale: number): number {
  return geometryUnitToPixels() * meshScaleMultiplier(definitionScale, companionScale);
}
