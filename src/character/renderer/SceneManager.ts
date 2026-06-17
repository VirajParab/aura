import * as THREE from "three";
import type { CharacterActivity, CharacterDefinition } from "@/types/character";
import { DEFAULT_COMPANION_SCALE } from "@/character/companionSettings";
import { createCharacterRenderer, VrmRenderer } from "./createCharacterRenderer";
import type { CharacterRenderer } from "./types";

export type { CharacterRenderer } from "./types";
export { PlaceholderRenderer } from "./PlaceholderRenderer";

export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;
  private renderer3d: CharacterRenderer | null = null;
  private companionScale = DEFAULT_COMPANION_SCALE;
  private animationId: number | null = null;
  private lastTime = 0;
  private onPositionUpdate: ((pos: { x: number; y: number }) => void) | null =
    null;

  constructor(canvas: HTMLCanvasElement) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera = new THREE.OrthographicCamera(
      -w / 2,
      w / 2,
      h / 2,
      -h / 2,
      0.1,
      1000,
    );
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 5, 5);
    this.scene.add(ambient, dir);
  }

  setCompanionScale(scale: number) {
    this.companionScale = scale;
    this.renderer3d?.setCompanionScale(scale);
  }

  async setCharacter(definition: CharacterDefinition): Promise<void> {
    if (this.renderer3d) {
      this.scene.remove(this.renderer3d.root);
      this.renderer3d.dispose();
      this.renderer3d = null;
    }
    this.renderer3d = await createCharacterRenderer(definition);
    this.renderer3d.setCompanionScale(this.companionScale);
    this.scene.add(this.renderer3d.root);
  }

  getCharacterRenderer(): CharacterRenderer | null {
    return this.renderer3d;
  }

  hasVrmModel(): boolean {
    return this.renderer3d instanceof VrmRenderer;
  }

  resize(width: number, height: number) {
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  startLoop(
    getPosition: () => { x: number; y: number },
    getActivity: () => CharacterActivity,
    onPositionUpdate?: (pos: { x: number; y: number }) => void,
    getCompanionScale?: () => number,
  ) {
    this.onPositionUpdate = onPositionUpdate ?? null;

    const loop = (time: number) => {
      const delta = this.lastTime ? time - this.lastTime : 16;
      this.lastTime = time;

      if (this.renderer3d) {
        const scale = getCompanionScale?.() ?? this.companionScale;
        if (scale !== this.companionScale) {
          this.companionScale = scale;
        }
        this.renderer3d.setCompanionScale(this.companionScale);

        const pos = getPosition();
        const activity = getActivity();
        this.renderer3d.setActivity(activity);
        this.renderer3d.update(delta, pos.x, pos.y);
        this.onPositionUpdate?.(pos);
      }

      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stopLoop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose() {
    this.stopLoop();
    this.renderer3d?.dispose();
    this.renderer.dispose();
  }
}
