import { companionHitTarget } from "@/character/engine/overlayHit";
import type { CharacterDefinition } from "@/types/character";
import type { AppSettings } from "@/types/character";

interface CharacterHitTargetProps {
  character: CharacterDefinition;
  settings: AppSettings;
  position: { x: number; y: number };
  onPointerDown?: (x: number, y: number) => void;
  onPointerUp?: (x: number, y: number) => void;
}

/** Invisible DOM target for Linux/Wayland input regions and pointer cursor. */
export function CharacterHitTarget({
  character,
  settings,
  position,
  onPointerDown,
  onPointerUp,
}: CharacterHitTargetProps) {
  const hit = companionHitTarget(position, character, settings);
  const size = hit.radius * 2;

  return (
    <div
      className="character-hit-target"
      style={{
        left: hit.x,
        top: hit.y,
        width: size,
        height: size,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e.clientX, e.clientY);
      }}
      aria-hidden
    />
  );
}
