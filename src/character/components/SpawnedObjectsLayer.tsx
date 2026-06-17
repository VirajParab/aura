import { SPAWN_LABELS } from "@/character/engine/ObjectSpawner";
import type { SpawnableObject } from "@/types/character";

const SPAWN_EMOJI: Record<SpawnableObject["type"], string> = {
  sticky_note: "📝",
  task_card: "✅",
  mini_calendar: "📅",
  memory_orb: "🔮",
  treasure_chest: "🎁",
  chart_board: "📈",
  terminal_screen: "💻",
};

interface SpawnedObjectsLayerProps {
  objects: SpawnableObject[];
  characterPosition: { x: number; y: number };
  onRemove: (id: string) => void;
  onOpen?: (type: SpawnableObject["type"]) => void;
}

function resolveScreenPosition(
  obj: SpawnableObject,
  characterPosition: { x: number; y: number },
): { x: number; y: number } {
  if (obj.anchor === "character") {
    return {
      x: characterPosition.x + obj.position.x,
      y: characterPosition.y + obj.position.y,
    };
  }
  return obj.position;
}

export function SpawnedObjectsLayer({
  objects,
  characterPosition,
  onRemove,
  onOpen,
}: SpawnedObjectsLayerProps) {
  return (
    <>
      {objects.map((obj) => {
        const screenPos = resolveScreenPosition(obj, characterPosition);
        const anchored = obj.anchor === "character";
        const accent = (obj.payload.color as string) ?? "#888";

        return (
          <div
            key={obj.id}
            className={`spawned-object spawned-object--${obj.type}${
              anchored ? " spawned-object--anchored" : ""
            }`}
            style={{
              left: screenPos.x,
              top: screenPos.y,
              borderColor: `${accent}88`,
              boxShadow: `0 8px 24px ${accent}33`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.(obj.type);
            }}
          >
            <div className="spawned-object-header">
              <span>
                {SPAWN_EMOJI[obj.type]} {SPAWN_LABELS[obj.type]}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(obj.id);
                }}
              >
                ×
              </button>
            </div>
            <p className="spawned-object-body">
              {(obj.payload.text as string) ??
                (obj.payload.label as string) ??
                "Aura object"}
            </p>
          </div>
        );
      })}
    </>
  );
}
