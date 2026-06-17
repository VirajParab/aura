import type * as THREE from "three";
import type { CharacterActivity } from "@/types/character";

export interface CharacterRenderer {
  readonly root: THREE.Group;
  load(): Promise<void>;
  setActivity(activity: CharacterActivity): void;
  setPosition(x: number, y: number): void;
  setCompanionScale(scale: number): void;
  update(deltaMs: number, screenX: number, screenY: number): void;
  dispose(): void;
  hitTest(screenX: number, screenY: number): boolean;
}
