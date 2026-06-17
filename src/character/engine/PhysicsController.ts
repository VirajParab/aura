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
  private falling = false;
  private fallVelocity = 0;

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

    this.state.position.y = config.anchorPosition.y;

    if (!effectiveFollow) {
      if (!this.falling) {
        this.target = null;
        this.state.position.x = config.anchorPosition.x;
        this.state.grounded = true;
        this.state.velocity = { x: 0, y: 0 };
      }
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
    this.falling = false;
    this.fallVelocity = 0;
  }

  moveTo(target: CharacterScreenPosition) {
    if (this.falling) return;
    this.target = { ...target };
  }

  triggerFall() {
    this.falling = true;
    this.fallVelocity = 0;
    this.target = null;
    this.state.grounded = false;
  }

  isFalling(): boolean {
    return this.falling;
  }

  isFollowingCursor(): boolean {
    return this.config.followCursor && this.characterSupportsFollow && !!this.target;
  }

  getState(): PhysicsState {
    return { ...this.state, position: { ...this.state.position } };
  }

  isMoving(): boolean {
    if (this.falling) return true;
    if (!this.target) return false;
    const dx = this.target.x - this.state.position.x;
    return Math.abs(dx) > 2;
  }

  getVelocityX(): number {
    return this.state.velocity.x;
  }

  update(deltaMs: number): "walk" | "run" | "sit" | "fall" {
    const dt = deltaMs / 1000;
    const speed = this.config.moveSpeed;

    if (this.falling) {
      this.fallVelocity += 420 * dt;
      this.state.position.y += this.fallVelocity * dt;
      this.state.velocity = { x: 0, y: this.fallVelocity };

      if (this.state.position.y >= this.config.anchorPosition.y) {
        this.state.position.y = this.config.anchorPosition.y;
        this.state.anchorY = this.config.anchorPosition.y;
        this.state.velocity = { x: 0, y: 0 };
        this.state.grounded = true;
        this.falling = false;
        this.fallVelocity = 0;
        return "sit";
      }
      return "fall";
    }

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

      const chasing = this.config.followCursor && this.characterSupportsFollow;
      const moveSpeed = chasing && dist > 200 ? speed * 1.8 : speed;
      const nx = (dx / dist) * moveSpeed * dt;
      const ny = (dy / dist) * moveSpeed * dt;
      this.state.position.x += nx;
      this.state.position.y += ny;
      this.state.velocity = { x: nx / dt, y: ny / dt };
      return chasing && dist > 120 ? "run" : "walk";
    }

    if (!this.config.followCursor) {
      this.state.position.x = this.config.anchorPosition.x;
      this.state.position.y = this.config.anchorPosition.y;
      this.state.anchorY = this.config.anchorPosition.y;
    } else {
      this.state.position.y = this.config.anchorPosition.y;
      this.state.anchorY = this.config.anchorPosition.y;
    }

    if (this.config.idleBob && this.state.grounded) {
      this.state.position.y =
        this.state.anchorY + Math.sin(Date.now() / 500) * 2;
    }

    this.state.velocity = { x: 0, y: 0 };
    return "sit";
  }

  applyFall() {
    this.triggerFall();
  }
}
