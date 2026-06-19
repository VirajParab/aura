import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import * as THREE from "three";
import {
  companionBodyHitCircle,
  vrmBasePixelScale,
} from "@/character/companionSettings";
import { computeActivityTransform, type PoseContext } from "@/character/engine/activityPose";
import type { CharacterActivity, CharacterDefinition } from "@/types/character";
import type { CharacterRenderer } from "./types";
import { PlaceholderRenderer } from "./PlaceholderRenderer";
import { createVrmAnimationPlayer, VrmAnimationPlayer } from "./VrmAnimationPlayer";
import { PROCEDURAL_LOCOMOTION_ACTIVITIES } from "./activityAnimationMap";

export class VrmRenderer implements CharacterRenderer {
  readonly root = new THREE.Group();
  private readonly modelGroup = new THREE.Group();
  private vrm: VRM | null = null;
  private animPlayer: VrmAnimationPlayer | null = null;
  private activity: CharacterActivity = "sit";
  private activityStartedAt = Date.now();
  private screenX = 0;
  private screenY = 0;
  private velocityX = 0;
  private poseModifiers: Partial<PoseContext> = {};
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

  private hitCircle() {
    return companionBodyHitCircle(
      { x: this.screenX, y: this.screenY },
      this.definition.scale,
      this.companionScale,
    );
  }

  hitTest(screenX: number, screenY: number): boolean {
    const { x, y, radius } = this.hitCircle();
    const dx = screenX - x;
    const dy = screenY - y;
    return dx * dx + dy * dy < radius * radius;
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
    if (vrm.meta?.metaVersion === "0") {
      VRMUtils.rotateVRM0(vrm);
    } else {
      vrm.scene.rotation.y = 0;
    }

    vrm.scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.metalness = Math.min(material.metalness, 0.25);
          material.roughness = Math.max(material.roughness, 0.45);
        }
      }
    });

    vrm.scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(vrm.scene);
    vrm.scene.position.y = -box.min.y;

    this.modelGroup.add(vrm.scene);
    this.setCompanionScale(this.companionScale);

    try {
      this.animPlayer = await createVrmAnimationPlayer(vrm, this.definition.id);
      this.animPlayer.setActivity(this.activity, true);
    } catch (err) {
      console.warn(`VRM animations failed for ${this.definition.id}:`, err);
    }
  }

  async load(): Promise<void> {
    // loaded via loadFromPath
  }

  setActivity(activity: CharacterActivity): void {
    if (activity !== this.activity) {
      this.activity = activity;
      this.activityStartedAt = Date.now();
      this.animPlayer?.setActivity(activity);
    }
  }

  setVelocityX(velocityX: number): void {
    this.velocityX = velocityX;
  }

  setPoseModifiers(modifiers: Partial<PoseContext>): void {
    this.poseModifiers = modifiers;
  }

  setPosition(_x: number, _y: number): void {
    // position applied in update()
  }

  update(deltaMs: number, screenX: number, screenY: number) {
    this.screenX = screenX;
    this.screenY = screenY;
    const tx = screenX - window.innerWidth / 2;
    const ty = window.innerHeight / 2 - screenY;

    const pose = computeActivityTransform(this.activity, {
      timeMs: performance.now(),
      activityElapsedMs: performance.now() - this.activityStartedAt,
      velocityX: this.velocityX,
      moving: Math.abs(this.velocityX) > 8,
      ...this.poseModifiers,
    });

    const skeletalAnim = this.animPlayer?.hasClips() ?? false;
    const locomotion = PROCEDURAL_LOCOMOTION_ACTIVITIES.has(this.activity);

    const flip = pose.rotationY > Math.PI / 2 ? -1 : 1;
    const pixelScale = vrmBasePixelScale(this.definition.scale, this.companionScale);

    this.root.position.set(
      tx + pose.offsetX,
      ty + (skeletalAnim && !locomotion ? 0 : pose.offsetY),
      0,
    );

    this.modelGroup.rotation.z = skeletalAnim && !locomotion ? 0 : pose.rotationZ;
    this.modelGroup.rotation.y = Math.PI + pose.rotationY;

    if (skeletalAnim && !locomotion) {
      this.modelGroup.scale.set(pixelScale * flip, pixelScale, pixelScale);
    } else {
      this.modelGroup.scale.set(
        pixelScale * pose.scaleX * flip,
        pixelScale * pose.scaleY,
        pixelScale,
      );
    }

    if (this.vrm) {
      this.animPlayer?.update(deltaMs / 1000, performance.now() / 1000);
      this.vrm.update(deltaMs / 1000);
    }
  }

  dispose(): void {
    this.animPlayer?.dispose();
    this.animPlayer = null;
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
