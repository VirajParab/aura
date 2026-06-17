import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, type VRM } from "@pixiv/three-vrm";
import * as THREE from "three";
import {
  visualHitRadiusPx,
  vrmBasePixelScale,
} from "@/character/companionSettings";
import type { CharacterActivity, CharacterDefinition } from "@/types/character";
import type { CharacterRenderer } from "./types";
import { PlaceholderRenderer } from "./PlaceholderRenderer";

export class VrmRenderer implements CharacterRenderer {
  readonly root = new THREE.Group();
  private readonly modelGroup = new THREE.Group();
  private vrm: VRM | null = null;
  private activity: CharacterActivity = "sit";
  private screenX = 0;
  private screenY = 0;
  private readonly definition: CharacterDefinition;
  private companionScale = 1;

  constructor(definition: CharacterDefinition) {
    this.definition = definition;
    this.modelGroup.rotation.y = Math.PI;
    this.root.add(this.modelGroup);
    this.setCompanionScale(1);
  }

  setCompanionScale(scale: number): void {
    this.companionScale = scale;
    const pixelScale = vrmBasePixelScale(this.definition.scale, scale);
    this.modelGroup.scale.setScalar(pixelScale);
    this.root.scale.setScalar(1);
  }

  private hitRadiusPx(): number {
    return visualHitRadiusPx(this.definition.scale, this.companionScale);
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
    vrm.scene.rotation.y = 0;

    vrm.scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(vrm.scene);
    vrm.scene.position.y = -box.min.y;

    this.modelGroup.add(vrm.scene);
    this.setCompanionScale(this.companionScale);
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
      if (this.activity === "sit" || this.activity === "idle") {
        this.modelGroup.rotation.z = Math.sin(Date.now() / 800) * 0.03;
      } else if (this.activity === "celebrate" || this.activity === "jump") {
        this.root.position.y += Math.abs(Math.sin(Date.now() / 200)) * 0.15;
      }
    }
  }

  hitTest(screenX: number, screenY: number): boolean {
    const radius = this.hitRadiusPx();
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
    this.modelGroup.clear();
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
