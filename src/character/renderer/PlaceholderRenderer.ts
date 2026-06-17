import * as THREE from "three";
import {
  geometryUnitToPixels,
  meshScaleMultiplier,
  visualHitRadiusPx,
} from "@/character/companionSettings";
import type { CharacterActivity, CharacterDefinition } from "@/types/character";
import type { CharacterRenderer } from "./types";

/**
 * Placeholder renderer — geometry is built in pixel space (1 unit ≈ 1 screen px).
 * Scale is applied to the mesh group, not the root, to avoid WebGL precision issues.
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
  private companionScale = 1;
  private readonly unit: number;

  constructor(definition: CharacterDefinition) {
    this.definition = definition;
    this.unit = geometryUnitToPixels();
    this.mesh = new THREE.Group();
    const color = new THREE.Color(definition.color);

    const bodyGeom =
      definition.category === "high_tech_ai"
        ? new THREE.CapsuleGeometry(0.35 * this.unit, 0.6 * this.unit, 12, 24)
        : definition.id === "ember"
          ? new THREE.ConeGeometry(0.4 * this.unit, 0.7 * this.unit, 8)
          : new THREE.CapsuleGeometry(0.4 * this.unit, 0.5 * this.unit, 12, 24);

    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.05,
    });
    this.body = new THREE.Mesh(bodyGeom, bodyMat);
    this.body.position.y = 0.5 * this.unit;
    this.mesh.add(this.body);

    const headGeom = new THREE.SphereGeometry(0.28 * this.unit, 24, 24);
    const headMat = new THREE.MeshStandardMaterial({
      color: color.clone().offsetHSL(0, 0, 0.08),
      roughness: 0.5,
      metalness: 0.05,
    });
    this.head = new THREE.Mesh(headGeom, headMat);
    this.head.position.y = 1.05 * this.unit;
    this.mesh.add(this.head);

    if (definition.id === "mochi" || definition.id === "pixel") {
      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(
          new THREE.ConeGeometry(0.12 * this.unit, 0.2 * this.unit, 6),
          headMat,
        );
        ear.position.set(side * 0.2 * this.unit, 1.25 * this.unit, 0);
        ear.rotation.z = side * 0.4;
        this.mesh.add(ear);
      }
    }

    if (definition.id === "nova") {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5 * this.unit, 0.03 * this.unit, 8, 32),
        new THREE.MeshBasicMaterial({
          color: 0x4fc3f7,
          transparent: true,
          opacity: 0.6,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1 * this.unit;
      this.mesh.add(ring);
    }

    this.root.scale.setScalar(1);
    this.root.add(this.mesh);
    this.setCompanionScale(1);
  }

  setCompanionScale(scale: number): void {
    this.companionScale = scale;
    const multiplier = meshScaleMultiplier(this.definition.scale, scale);
    this.mesh.scale.setScalar(multiplier);
    this.root.scale.setScalar(1);
  }

  private hitRadiusPx(): number {
    return visualHitRadiusPx(this.definition.scale, this.companionScale);
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
    const u = this.unit;
    const m = meshScaleMultiplier(this.definition.scale, this.companionScale);

    switch (this.activity) {
      case "walk":
      case "run":
        this.mesh.rotation.z = Math.sin(this.bobPhase * 3) * 0.08;
        this.body.position.y =
          0.5 * u + Math.abs(Math.sin(this.bobPhase * 4)) * 0.05 * u;
        break;
      case "celebrate":
      case "jump":
        this.mesh.position.y = Math.abs(Math.sin(this.bobPhase * 2)) * 0.3 * u * m;
        break;
      case "wave":
        this.head.rotation.z = Math.sin(this.bobPhase * 6) * 0.2;
        break;
      case "think":
        this.head.rotation.x = -0.15;
        break;
      case "eat":
        this.head.rotation.x = 0.25;
        this.head.position.y =
          1.05 * u + Math.abs(Math.sin(this.bobPhase * 8)) * 0.05 * u;
        break;
      case "sleep":
        this.mesh.rotation.z = 1.2;
        this.mesh.position.y = -0.2 * u * m;
        break;
      default:
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, 0.1);
        this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, 0, 0.1);
        this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0, 0.1);
        this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0, 0.1);
        this.body.position.y = 0.5 * u + Math.sin(this.bobPhase) * 0.02 * u;
    }
  }

  hitTest(screenX: number, screenY: number): boolean {
    const radius = this.hitRadiusPx();
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
