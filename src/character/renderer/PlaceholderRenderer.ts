import * as THREE from "three";
import { visualHitRadiusPx } from "@/character/companionSettings";
import type { CharacterActivity, CharacterDefinition } from "@/types/character";
import type { CharacterRenderer } from "./types";

/**
 * Invisible placeholder — the CompanionSprite emoji is the on-screen visual.
 * This renderer only tracks position and hit-testing until a VRM model is added.
 */
export class PlaceholderRenderer implements CharacterRenderer {
  readonly root = new THREE.Group();
  private readonly definition: CharacterDefinition;
  private screenX = 0;
  private screenY = 0;
  private companionScale = 1;

  constructor(definition: CharacterDefinition) {
    this.definition = definition;
  }

  setCompanionScale(scale: number): void {
    this.companionScale = scale;
  }

  private hitRadiusPx(): number {
    return visualHitRadiusPx(this.definition.scale, this.companionScale);
  }

  async load(): Promise<void> {
    return Promise.resolve();
  }

  setActivity(_activity: CharacterActivity): void {
    // animations shown via CompanionSprite / engine state
  }

  setPosition(screenX: number, screenY: number): void {
    this.root.position.set(screenX, screenY, 0);
  }

  update(_deltaMs: number, screenX: number, screenY: number) {
    this.screenX = screenX;
    this.screenY = screenY;
    const tx = screenX - window.innerWidth / 2;
    const ty = window.innerHeight / 2 - screenY;
    this.root.position.set(tx, ty, 0);
  }

  hitTest(screenX: number, screenY: number): boolean {
    const radius = this.hitRadiusPx();
    const dx = screenX - this.screenX;
    const dy = screenY - this.screenY;
    return dx * dx + dy * dy < radius * radius;
  }

  dispose(): void {
    this.root.clear();
  }
}
