import { characterHeightPx } from "@/character/companionSettings";
import type { CharacterDefinition } from "@/types/character";
import type { AppSettings } from "@/types/character";

interface CompanionSpriteProps {
  character: CharacterDefinition;
  settings: AppSettings;
  position: { x: number; y: number };
}

export function CompanionSprite({
  character,
  settings,
  position,
}: CompanionSpriteProps) {
  const heightPx = characterHeightPx(character.scale, settings.companion_scale);
  const fontSize = Math.max(28, heightPx * 0.55);

  return (
    <div
      className="companion-sprite"
      style={{
        left: position.x,
        top: position.y,
        fontSize: `${fontSize}px`,
      }}
      aria-hidden
    >
      {character.emoji}
    </div>
  );
}
