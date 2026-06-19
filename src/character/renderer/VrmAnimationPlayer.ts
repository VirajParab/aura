import {
  createVRMAnimationClip,
  VRMAnimationLoaderPlugin,
  type VRMAnimation,
} from "@pixiv/three-vrm-animation";
import type { VRM } from "@pixiv/three-vrm";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import type { CharacterActivity } from "@/types/character";
import {
  ACTIVITY_ANIMATION_CLIP,
  isLoopingActivity,
  PROCEDURAL_LOCOMOTION_ACTIVITIES,
  SHARED_ANIMATION_IDS,
} from "./activityAnimationMap";
import {
  applyProceduralLocomotion,
  clearProceduralLocomotion,
} from "./proceduralLocomotion";

const FADE_SEC = 0.25;

export class VrmAnimationPlayer {
  private mixer: THREE.AnimationMixer | null = null;
  private currentAction: THREE.AnimationAction | null = null;
  private currentClipId: string | null = null;
  private readonly clips = new Map<string, THREE.AnimationClip>();
  private activity: CharacterActivity = "sit";
  private procedural = false;
  private readonly loader = new GLTFLoader();

  constructor(private readonly vrm: VRM) {
    this.loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
  }

  async loadClip(animationId: string, absolutePath: string): Promise<boolean> {
    try {
      const gltf = await this.loader.loadAsync(convertFileSrc(absolutePath));
      const vrmAnimation = (gltf.userData.vrmAnimations as VRMAnimation[] | undefined)?.[0];
      if (!vrmAnimation) return false;
      const clip = createVRMAnimationClip(vrmAnimation, this.vrm);
      clip.name = animationId;
      this.clips.set(animationId, clip);
      if (!this.mixer) {
        this.mixer = new THREE.AnimationMixer(this.vrm.scene);
        this.mixer.addEventListener("finished", this.onFinished);
      }
      return true;
    } catch (err) {
      console.warn(`Failed to load animation ${animationId}:`, err);
      return false;
    }
  }

  async loadSharedLibrary(): Promise<void> {
    await Promise.all(
      SHARED_ANIMATION_IDS.map(async (id) => {
        const path = await invoke<string | null>("get_animation_path", { animationId: id });
        if (path) await this.loadClip(id, path);
      }),
    );
  }

  async loadCharacterLibrary(characterId: string): Promise<void> {
    const ids = await invoke<string[]>("list_character_animation_ids", { characterId });
    await Promise.all(
      ids.map(async (id) => {
        const path = await invoke<string | null>("get_character_animation_path", {
          characterId,
          animationId: id,
        });
        if (path) await this.loadClip(id, path);
      }),
    );
  }

  setActivity(activity: CharacterActivity, force = false): void {
    if (!force && activity === this.activity && this.currentClipId) return;
    this.activity = activity;

    if (PROCEDURAL_LOCOMOTION_ACTIVITIES.has(activity)) {
      this.stopClip();
      this.procedural = true;
      return;
    }

    this.procedural = false;
    clearProceduralLocomotion(this.vrm);

    const clipId = ACTIVITY_ANIMATION_CLIP[activity] ?? "relax";
    this.playClip(clipId, isLoopingActivity(activity));
  }

  private onFinished = (event: { action: THREE.AnimationAction }): void => {
    if (event.action !== this.currentAction) return;
    if (PROCEDURAL_LOCOMOTION_ACTIVITIES.has(this.activity)) return;
    if (isLoopingActivity(this.activity)) return;
    this.playClip("relax", true);
  };

  private playClip(clipId: string, loop: boolean): void {
    if (!this.mixer) return;

    if (clipId === this.currentClipId && this.currentAction) {
      this.currentAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
      this.currentAction.clampWhenFinished = !loop;
      return;
    }

    const clip = this.clips.get(clipId);
    if (!clip) return;

    const next = this.mixer.clipAction(clip);
    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;

    if (this.currentAction) {
      this.currentAction.crossFadeTo(next, FADE_SEC, false);
    } else {
      next.play();
    }

    this.currentAction = next;
    this.currentClipId = clipId;
  }

  private stopClip(): void {
    if (this.currentAction) {
      this.currentAction.fadeOut(FADE_SEC);
      this.currentAction = null;
      this.currentClipId = null;
    }
  }

  update(deltaSec: number, timeSec: number): void {
    if (this.procedural) {
      const mode =
        this.activity === "run" || this.activity === "follow_cursor" ? "run" : "walk";
      applyProceduralLocomotion(this.vrm, timeSec, mode);
      return;
    }

    this.mixer?.update(deltaSec);
  }

  hasClips(): boolean {
    return this.clips.size > 0;
  }

  dispose(): void {
    this.mixer?.removeEventListener("finished", this.onFinished);
    this.mixer?.stopAllAction();
    this.mixer = null;
    this.currentAction = null;
    this.clips.clear();
  }
}

export async function createVrmAnimationPlayer(
  vrm: VRM,
  characterId: string,
): Promise<VrmAnimationPlayer> {
  const player = new VrmAnimationPlayer(vrm);
  await player.loadSharedLibrary();
  await player.loadCharacterLibrary(characterId);
  return player;
}