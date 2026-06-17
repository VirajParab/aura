import * as THREE from "three";
import type { CharacterActivity, CharacterDefinition } from "@/types/character";

export interface CharacterRenderer {
  readonly root: THREE.Group;
  load(): Promise<void>;
  setActivity(activity: CharacterActivity): void;
  setPosition(x: number, y: number): void;
  dispose(): void;
  hitTest(screenX: number, screenY: number): boolean;
}

/**
 * Placeholder renderer until VRM models are added.
 * Renders a stylized character mesh per launch lineup member.
 */
export class PlaceholderRenderer implements CharacterRenderer {
  readonly root = new THREE.Group();
  private mesh: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private activity: CharacterActivity = "sit";
  private bobPhase = 0;
  private readonly definition: CharacterDefinition;
  private screenX = 0;
  private screenY = 0;

  constructor(definition: CharacterDefinition) {
    this.definition = definition;
    this.mesh = new THREE.Group();
    const color = new THREE.Color(definition.color);

    // Body
    const bodyGeom =
      definition.category === "high_tech_ai"
        ? new THREE.CapsuleGeometry(0.35, 0.6, 8, 16)
        : definition.id === "ember"
          ? new THREE.ConeGeometry(0.4, 0.7, 6)
          : new THREE.CapsuleGeometry(0.4, 0.5, 8, 16);

    const bodyMat = new THREE.MeshToonMaterial({ color });
    this.body = new THREE.Mesh(bodyGeom, bodyMat);
    this.body.position.y = 0.5;
    this.mesh.add(this.body);

    // Head
    const headGeom = new THREE.SphereGeometry(0.28, 16, 16);
    const headMat = new THREE.MeshToonMaterial({
      color: color.clone().offsetHSL(0, 0, 0.1),
    });
    this.head = new THREE.Mesh(headGeom, headMat);
    this.head.position.y = 1.05;
    this.mesh.add(this.head);

    // Ears for Mochi / Pixel
    if (definition.id === "mochi" || definition.id === "pixel") {
      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.2, 4),
          headMat,
        );
        ear.position.set(side * 0.2, 1.25, 0);
        ear.rotation.z = side * 0.4;
        this.mesh.add(ear);
      }
    }

    // Nova glow ring
    if (definition.id === "nova") {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.03, 8, 32),
        new THREE.MeshBasicMaterial({
          color: 0x4fc3f7,
          transparent: true,
          opacity: 0.6,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1;
      this.mesh.add(ring);
    }

    this.mesh.scale.setScalar(definition.scale);
    this.root.add(this.mesh);
  }

  async load(): Promise<void> {
    // VRM load path: check for model file, fall back to placeholder
    return Promise.resolve();
  }

  setActivity(activity: CharacterActivity): void {
    this.activity = activity;
  }

  setPosition(screenX: number, screenY: number): void {
    // Screen coords → normalized overlay coords handled by parent
    this.root.position.set(screenX, screenY, 0);
  }

  update(deltaMs: number, screenX: number, screenY: number) {
    this.screenX = screenX;
    this.screenY = screenY;
    const tx = screenX - window.innerWidth / 2;
    const ty = window.innerHeight / 2 - screenY;
    this.root.position.x = tx;
    this.root.position.y = ty;

    this.bobPhase += deltaMs * 0.003;

    switch (this.activity) {
      case "walk":
      case "run":
        this.mesh.rotation.z = Math.sin(this.bobPhase * 3) * 0.08;
        this.body.position.y = 0.5 + Math.abs(Math.sin(this.bobPhase * 4)) * 0.05;
        break;
      case "celebrate":
      case "jump":
        this.mesh.position.y = Math.abs(Math.sin(this.bobPhase * 2)) * 0.3;
        break;
      case "wave":
        this.head.rotation.z = Math.sin(this.bobPhase * 6) * 0.2;
        break;
      case "think":
        this.head.rotation.x = -0.15;
        break;
      case "sleep":
        this.mesh.rotation.z = 1.2;
        this.mesh.position.y = -0.2;
        break;
      default:
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, 0.1);
        this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, 0, 0.1);
        this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0, 0.1);
        this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0, 0.1);
        this.body.position.y = 0.5 + Math.sin(this.bobPhase) * 0.02;
    }
  }

  hitTest(screenX: number, screenY: number): boolean {
    const radius = 60 * this.definition.scale;
    const dx = screenX - this.screenX;
    const dy = screenY - this.screenY;
    return dx * dx + dy * dy < radius * radius;
  }

  dispose(): void {
    this.root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}

export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;
  private renderer3d: PlaceholderRenderer | null = null;
  private animationId: number | null = null;
  private lastTime = 0;

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

  setCharacter(definition: CharacterDefinition) {
    if (this.renderer3d) {
      this.scene.remove(this.renderer3d.root);
      this.renderer3d.dispose();
    }
    this.renderer3d = new PlaceholderRenderer(definition);
    this.scene.add(this.renderer3d.root);
  }

  getCharacterRenderer(): PlaceholderRenderer | null {
    return this.renderer3d;
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
  ) {
    const loop = (time: number) => {
      const delta = this.lastTime ? time - this.lastTime : 16;
      this.lastTime = time;

      if (this.renderer3d) {
        const pos = getPosition();
        const activity = getActivity();
        // Convert screen (top-left origin) to Three ortho (center origin, y-up)
        const tx = pos.x;
        const ty = pos.y;
        this.renderer3d.setActivity(activity);
        this.renderer3d.update(delta, tx, ty);
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
