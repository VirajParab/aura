import { SPAWN_LABELS } from "@/character/engine/ObjectSpawner";
import type { SpawnableObject } from "@/types/character";

interface SpawnedObjectsLayerProps {
  objects: SpawnableObject[];
  characterPosition: { x: number; y: number };
  onRemove: (id: string) => void;
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
}: SpawnedObjectsLayerProps) {
  return (
    <>
      {objects.map((obj) => {
        const screenPos = resolveScreenPosition(obj, characterPosition);
        const anchored = obj.anchor === "character";

        return (
          <div
            key={obj.id}
            className={`spawned-object spawned-object--${obj.type}${
              anchored ? " spawned-object--anchored" : ""
            }`}
            style={{ left: screenPos.x, top: screenPos.y }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="spawned-object-header">
              <span>{SPAWN_LABELS[obj.type]}</span>
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
              {(obj.payload.label as string) ??
                (obj.payload.text as string) ??
                "Phase 2: live data"}
            </p>
          </div>
        );
      })}
    </>
  );
}
