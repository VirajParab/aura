import type { SpawnableObject, SpawnObjectType } from "@/types/character";

let objectId = 0;

export class ObjectSpawner {
  private objects: SpawnableObject[] = [];
  private listeners = new Set<(objects: SpawnableObject[]) => void>();

  subscribe(listener: (objects: SpawnableObject[]) => void) {
    this.listeners.add(listener);
    listener([...this.objects]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = [...this.objects];
    this.listeners.forEach((l) => l(copy));
  }

  spawn(
    type: SpawnObjectType,
    characterId: string,
    position: { x: number; y: number },
    payload: Record<string, unknown> = {},
  ): SpawnableObject {
    const obj: SpawnableObject = {
      id: `spawn_${++objectId}`,
      type,
      position,
      anchor: "desktop",
      payload,
      character_id: characterId,
    };
    this.objects.push(obj);
    this.notify();
    return obj;
  }

  remove(id: string) {
    this.objects = this.objects.filter((o) => o.id !== id);
    this.notify();
  }

  getAll(): SpawnableObject[] {
    return [...this.objects];
  }

  dispose() {
    this.objects = [];
    this.listeners.clear();
  }
}

export const SPAWN_LABELS: Record<SpawnObjectType, string> = {
  sticky_note: "Quick Note",
  task_card: "Task",
  mini_calendar: "Calendar",
  memory_orb: "Memory Orb",
  treasure_chest: "Achievement",
  chart_board: "Trading Chart",
  terminal_screen: "Terminal",
};
