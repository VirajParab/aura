import type { CharacterDefinition } from "@/types/character";

interface CharacterEffectsProps {
  character: CharacterDefinition;
  effect: "cherry_blossom" | "hologram" | "fire" | "none";
  position: { x: number; y: number };
}

const PETAL_COUNT = 14;
const SPARK_COUNT = 10;

export function CharacterEffects({
  character,
  effect,
  position,
}: CharacterEffectsProps) {
  if (effect === "none") return null;

  const particles = Array.from({
    length: effect === "cherry_blossom" ? PETAL_COUNT : SPARK_COUNT,
  });

  return (
    <div
      className={`character-effects character-effects--${effect}`}
      style={{ left: position.x, top: position.y }}
      aria-hidden
    >
      {particles.map((_, index) => (
        <span
          key={`${effect}-${index}`}
          className="character-effects-particle"
          style={{
            ["--i" as string]: index,
            ["--color" as string]: character.color,
            animationDelay: `${index * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
