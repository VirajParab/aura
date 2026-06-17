import type { CharacterDefinition, CharacterScreenPosition } from "@/types/character";

export interface PhysicsState {
  position: CharacterScreenPosition;
  velocity: { x: number; y: number };
  grounded: boolean;
  anchorY: number;
}

export class PhysicsController {
  private state: PhysicsState;
  private target: CharacterScreenPosition | null = null;
  private followCursor = false;
  private bounds = { width: window.innerWidth, height: window.innerHeight };

  constructor(initial: CharacterScreenPosition) {
    const anchorY = initial.y;
    this.state = {
      position: { ...initial },
      velocity: { x: 0, y: 0 },
      grounded: true,
      anchorY,
    };
  }

  setBounds(width: number, height: number) {
    this.bounds = { width, height };
    this.state.anchorY = height - 80;
  }

  configure(character: CharacterDefinition, followCursor: boolean) {
    this.followCursor =
      followCursor && character.behaviors.follow_cursor;
  }

  setCursorPosition(pos: CharacterScreenPosition) {
    if (this.followCursor) {
      this.target = {
        x: Math.max(40, Math.min(this.bounds.width - 40, pos.x)),
        y: this.state.anchorY,
      };
    }
  }

  moveTo(target: CharacterScreenPosition) {
    this.target = target;
  }

  getState(): PhysicsState {
    return { ...this.state, position: { ...this.state.position } };
  }

  isMoving(): boolean {
    if (!this.target) return false;
    const dx = this.target.x - this.state.position.x;
    return Math.abs(dx) > 2;
  }

  update(deltaMs: number, speed = 120): "walk" | "run" | "sit" {
    const dt = deltaMs / 1000;

    if (this.target) {
      const dx = this.target.x - this.state.position.x;
      const dy = this.target.y - this.state.position.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        this.state.position = { ...this.target };
        this.target = null;
        this.state.velocity = { x: 0, y: 0 };
        this.state.grounded = true;
        return "sit";
      }

      const moveSpeed =
        this.followCursor && dist > 200 ? speed * 1.8 : speed;
      const nx = (dx / dist) * moveSpeed * dt;
      const ny = (dy / dist) * moveSpeed * dt;
      this.state.position.x += nx;
      this.state.position.y += ny;
      this.state.velocity = { x: nx / dt, y: ny / dt };
      return this.followCursor && dist > 120 ? "run" : "walk";
    }

    // Gentle idle bob
    if (this.state.grounded) {
      this.state.position.y =
        this.state.anchorY + Math.sin(Date.now() / 500) * 2;
    }

    return "sit";
  }

  applyFall() {
    this.state.grounded = false;
    this.state.velocity.y += 0.5;
    this.state.position.y += this.state.velocity.y;
    if (this.state.position.y >= this.state.anchorY) {
      this.state.position.y = this.state.anchorY;
      this.state.velocity = { x: 0, y: 0 };
      this.state.grounded = true;
    }
  }
}
