import * as THREE from "three";
import type { CharacterActivity, CharacterDefinition } from "@/types/character";
import type { CharacterRenderer } from "./types";

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

    const headGeom = new THREE.SphereGeometry(0.28, 16, 16);
    const headMat = new THREE.MeshToonMaterial({
      color: color.clone().offsetHSL(0, 0, 0.1),
    });
    this.head = new THREE.Mesh(headGeom, headMat);
    this.head.position.y = 1.05;
    this.mesh.add(this.head);

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
    return Promise.resolve();
  }

  setActivity(activity: CharacterActivity): void {
    this.activity = activity;
  }

  setPosition(screenX: number, screenY: number): void {
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
      case "eat":
        this.head.rotation.x = 0.25;
        this.head.position.y = 1.05 + Math.abs(Math.sin(this.bobPhase * 8)) * 0.05;
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
