import { invoke } from "@tauri-apps/api/core";
import { companionBodyHitCircle } from "@/character/companionSettings";
import type { CharacterDefinition, AppSettings, SpawnableObject } from "@/types/character";

export interface HitCircle {
  x: number;
  y: number;
  radius: number;
}

export function companionHitTarget(
  position: { x: number; y: number },
  character: CharacterDefinition,
  settings: AppSettings,
): HitCircle {
  return companionBodyHitCircle(
    position,
    character.scale,
    settings.companion_scale,
  );
}

function spawnedHitCircles(
  objects: SpawnableObject[],
  characterPosition: { x: number; y: number },
): HitCircle[] {
  return objects.map((obj) => {
    const sx =
      obj.anchor === "character"
        ? characterPosition.x + obj.position.x
        : obj.position.x;
    const sy =
      obj.anchor === "character"
        ? characterPosition.y + obj.position.y
        : obj.position.y;
    return { x: sx + 90, y: sy + 40, radius: 100 };
  });
}

export function buildHitCircles(
  position: { x: number; y: number },
  character: CharacterDefinition,
  settings: AppSettings,
  spawned: SpawnableObject[],
): HitCircle[] {
  return [
    companionHitTarget(position, character, settings),
    ...spawnedHitCircles(spawned, position),
  ];
}

export async function syncOverlayHitRegions(
  position: { x: number; y: number },
  character: CharacterDefinition,
  settings: AppSettings,
  spawned: SpawnableObject[],
  forceInteractive: boolean,
) {
  const circles = buildHitCircles(position, character, settings, spawned);
  await invoke("set_overlay_hit_region", {
    circles,
    forceInteractive,
  });
}
