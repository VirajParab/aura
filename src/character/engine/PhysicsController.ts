import type { CharacterDefinition, CharacterScreenPosition } from "@/types/character";

export interface PhysicsConfig {
  followCursor: boolean;
  locomotionEnabled: boolean;
  idleBob: boolean;
  moveSpeed: number;
  anchorPosition: CharacterScreenPosition;
}

export interface PhysicsState {
  position: CharacterScreenPosition;
  velocity: { x: number; y: number };
  grounded: boolean;
  anchorY: number;
}

export class PhysicsController {
  private state: PhysicsState;
  private target: CharacterScreenPosition | null = null;
  private config: PhysicsConfig = {
    followCursor: false,
    locomotionEnabled: true,
    idleBob: true,
    moveSpeed: 120,
    anchorPosition: { x: 0, y: 0 },
  };
  private bounds = { width: window.innerWidth, height: window.innerHeight };
  private characterSupportsFollow = true;

  constructor(initial: CharacterScreenPosition) {
    const anchorY = initial.y;
    this.state = {
      position: { ...initial },
      velocity: { x: 0, y: 0 },
      grounded: true,
      anchorY,
    };
    this.config.anchorPosition = { ...initial };
  }

  setBounds(width: number, height: number) {
    this.bounds = { width, height };
  }

  configure(character: CharacterDefinition, config: PhysicsConfig) {
    this.characterSupportsFollow = character.behaviors.follow_cursor;
    const effectiveFollow = config.followCursor && this.characterSupportsFollow;
    this.config = { ...config, followCursor: effectiveFollow };
    this.state.anchorY = config.anchorPosition.y;

    // Always apply anchor immediately (vertical always; horizontal when not following)
    this.state.position.y = config.anchorPosition.y;

    if (!effectiveFollow) {
      this.target = null;
      this.state.position.x = config.anchorPosition.x;
      this.state.grounded = true;
      this.state.velocity = { x: 0, y: 0 };
    } else if (this.target) {
      this.target.y = config.anchorPosition.y;
    }
  }

  setCursorPosition(pos: CharacterScreenPosition) {
    if (!this.config.followCursor || !this.characterSupportsFollow) return;

    this.target = {
      x: Math.max(40, Math.min(this.bounds.width - 40, pos.x)),
      y: this.config.anchorPosition.y,
    };
  }

  setPosition(pos: CharacterScreenPosition) {
    this.state.position = { ...pos };
    this.state.anchorY = pos.y;
    this.config.anchorPosition = { ...pos };
    this.target = null;
    this.state.velocity = { x: 0, y: 0 };
    this.state.grounded = true;
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

  update(deltaMs: number): "walk" | "run" | "sit" {
    const dt = deltaMs / 1000;
    const speed = this.config.moveSpeed;

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

      if (!this.config.locomotionEnabled) {
        this.state.position = { ...this.target };
        this.target = null;
        return "sit";
      }

      const moveSpeed =
        this.config.followCursor && dist > 200 ? speed * 1.8 : speed;
      const nx = (dx / dist) * moveSpeed * dt;
      const ny = (dy / dist) * moveSpeed * dt;
      this.state.position.x += nx;
      this.state.position.y += ny;
      this.state.velocity = { x: nx / dt, y: ny / dt };
      return this.config.followCursor && dist > 120 ? "run" : "walk";
    }

    if (!this.config.followCursor) {
      this.state.position.x = this.config.anchorPosition.x;
      this.state.position.y = this.config.anchorPosition.y;
      this.state.anchorY = this.config.anchorPosition.y;
    } else {
      // While following cursor, still lock Y to the configured floor line
      this.state.position.y = this.config.anchorPosition.y;
      this.state.anchorY = this.config.anchorPosition.y;
    }

    if (this.config.idleBob && this.state.grounded) {
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
