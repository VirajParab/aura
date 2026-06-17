import { SPAWN_LABELS } from "@/character/engine/ObjectSpawner";
import type { SpawnableObject } from "@/types/character";

interface SpawnedObjectsLayerProps {
  objects: SpawnableObject[];
  onRemove: (id: string) => void;
}

export function SpawnedObjectsLayer({
  objects,
  onRemove,
}: SpawnedObjectsLayerProps) {
  return (
    <>
      {objects.map((obj) => (
        <div
          key={obj.id}
          className={`spawned-object spawned-object--${obj.type}`}
          style={{ left: obj.position.x, top: obj.position.y }}
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
      ))}
    </>
  );
}
