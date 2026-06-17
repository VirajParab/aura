import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, type VRM } from "@pixiv/three-vrm";
import * as THREE from "three";
import type { CharacterActivity, CharacterDefinition } from "@/types/character";
import { PlaceholderRenderer } from "./PlaceholderRenderer";
import type { CharacterRenderer } from "./types";

export class VrmRenderer implements CharacterRenderer {
  readonly root = new THREE.Group();
  private vrm: VRM | null = null;
  private activity: CharacterActivity = "sit";
  private screenX = 0;
  private screenY = 0;
  private readonly definition: CharacterDefinition;

  constructor(definition: CharacterDefinition) {
    this.definition = definition;
    this.root.scale.setScalar(definition.scale);
  }

  async loadFromPath(absolutePath: string): Promise<void> {
    const url = convertFileSrc(absolutePath);
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const gltf = await loader.loadAsync(url);
    const vrm = gltf.userData.vrm as VRM | undefined;
    if (!vrm) {
      throw new Error("No VRM data in model file");
    }
    this.vrm = vrm;
    this.root.add(vrm.scene);
  }

  async load(): Promise<void> {
    // loaded via loadFromPath
  }

  setActivity(activity: CharacterActivity): void {
    this.activity = activity;
  }

  setPosition(_x: number, _y: number): void {
    // position applied in update()
  }

  update(deltaMs: number, screenX: number, screenY: number) {
    this.screenX = screenX;
    this.screenY = screenY;
    const tx = screenX - window.innerWidth / 2;
    const ty = window.innerHeight / 2 - screenY;
    this.root.position.set(tx, ty, 0);

    if (this.vrm) {
      this.vrm.update(deltaMs / 1000);
      // Subtle idle sway
      if (this.activity === "sit" || this.activity === "idle") {
        this.root.rotation.z = Math.sin(Date.now() / 800) * 0.03;
      } else if (this.activity === "celebrate" || this.activity === "jump") {
        this.root.position.y += Math.abs(Math.sin(Date.now() / 200)) * 0.15;
      }
    }
  }

  hitTest(screenX: number, screenY: number): boolean {
    const radius = 70 * this.definition.scale;
    const dx = screenX - this.screenX;
    const dy = screenY - this.screenY;
    return dx * dx + dy * dy < radius * radius;
  }

  dispose(): void {
    if (this.vrm) {
      this.vrm.scene.removeFromParent();
      this.vrm.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.vrm = null;
    }
    this.root.clear();
  }
}

export async function createCharacterRenderer(
  definition: CharacterDefinition,
): Promise<CharacterRenderer> {
  try {
    const modelPath = await invoke<string | null>("get_character_model_path", {
      characterId: definition.id,
    });
    if (modelPath) {
      const vrm = new VrmRenderer(definition);
      await vrm.loadFromPath(modelPath);
      return vrm;
    }
  } catch (err) {
    console.warn(`VRM load failed for ${definition.id}, using placeholder:`, err);
  }

  const placeholder = new PlaceholderRenderer(definition);
  await placeholder.load();
  return placeholder;
}
