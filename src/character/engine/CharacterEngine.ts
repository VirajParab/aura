import { invoke } from "@tauri-apps/api/core";
import { mergeSettings, percentToPosition, motionReduced } from "@/character/companionSettings";
import { AmbientController } from "./AmbientController";
import { AnimationController } from "./AnimationController";
import {
  characterEffectType,
  type CompanionMenuAction,
  getDoubleClickWidgets,
  spawnForInteraction,
  spawnPayload,
  SPEECH_BY_ACTION,
} from "./characterPlatform";
import { InputHandler } from "./InputHandler";
import { ObjectSpawner } from "./ObjectSpawner";
import { PhysicsController } from "./PhysicsController";
import { WindowAnchorSystem } from "./WindowAnchorSystem";
import type {
  AppSettings,
  CharacterDefinition,
  InteractionEvent,
  SpawnObjectType,
  WidgetType,
} from "@/types/character";
import type { CharacterActivity } from "@/types/character";

export interface CharacterEngineCallbacks {
  onActivityChange?: (activity: CharacterActivity) => void;
  onSpeech?: (text: string | null) => void;
  onWidgetOpen?: (widget: WidgetType | null, variant?: string | null) => void;
  onHideVisual?: (hide: boolean) => void;
  onEffectChange?: (effect: "cherry_blossom" | "hologram" | "fire" | "none") => void;
  onActionMenuChange?: (open: boolean) => void;
}

export class CharacterEngine {
  readonly animation: AnimationController;
  readonly physics: PhysicsController;
  readonly spawner: ObjectSpawner;
  readonly windowAnchor = new WindowAnchorSystem();

  private input: InputHandler | null = null;
  private character: CharacterDefinition | null = null;
  private physicsLoop: ReturnType<typeof setInterval> | null = null;
  private desktopLoop: ReturnType<typeof setInterval> | null = null;
  private callbacks: CharacterEngineCallbacks;
  private lastSettings: AppSettings | null = null;
  private ambient = new AmbientController();
  private ambientTick = 0;
  private systemCheckTick = 0;
  private doubleClickIndex = 0;
  private previousAnchorY: number | null = null;

  constructor(callbacks: CharacterEngineCallbacks = {}) {
    this.callbacks = callbacks;
    this.animation = new AnimationController();
    this.physics = new PhysicsController({
      x: window.innerWidth / 2,
      y: window.innerHeight - 80,
    });
    this.spawner = new ObjectSpawner();
    this.physics.setBounds(window.innerWidth, window.innerHeight);

    this.animation.subscribe((activity) => {
      this.callbacks.onActivityChange?.(activity);
      if (this.character) {
        this.callbacks.onEffectChange?.(characterEffectType(this.character, activity));
      }
    });
  }

  loadCharacter(character: CharacterDefinition, settings: AppSettings) {
    this.character = character;
    this.lastSettings = settings;
    this.doubleClickIndex = 0;
    this.previousAnchorY = null;
    this.input?.dispose();
    this.input = new InputHandler(
      character.id,
      character.interactions,
      (event) => this.handleInteraction(event),
    );
    this.applyCompanionSettings(settings);
    this.animation.setBase("sit");
    void this.refreshDesktop();
  }

  applyCompanionSettings(settings: AppSettings) {
    const merged = mergeSettings(settings);
    this.lastSettings = merged;
    const reduced = motionReduced(merged);
    const anchor = this.character
      ? this.windowAnchor.getAnchorPosition(
          this.character,
          merged,
          window.innerWidth,
          window.innerHeight,
        )
      : percentToPosition(
          merged.position_x_percent,
          merged.position_y_percent,
          window.innerWidth,
          window.innerHeight,
        );

    if (this.character) {
      const effectiveFollow =
        merged.follow_cursor && !reduced && this.character.behaviors.follow_cursor;

      this.physics.configure(this.character, {
        followCursor: effectiveFollow,
        locomotionEnabled: merged.locomotion_enabled && !reduced,
        idleBob: merged.idle_bob && !reduced,
        moveSpeed: merged.move_speed,
        anchorPosition: anchor,
      });

      if (
        this.previousAnchorY !== null &&
        this.windowAnchor.shouldFall(this.previousAnchorY, anchor.y)
      ) {
        this.physics.triggerFall();
      }
      this.previousAnchorY = anchor.y;

      if (effectiveFollow) {
        void getCursorPosition().then((pos) => {
          this.setCursorPosition(pos.x, pos.y);
        });
      }
    } else {
      this.physics.setPosition(anchor);
    }
  }

  async refreshDesktop() {
    await this.windowAnchor.refresh();
    if (this.lastSettings) {
      this.applyCompanionSettings(this.lastSettings);
    }
  }

  start() {
    void this.refreshDesktop();
    this.desktopLoop = setInterval(() => {
      void this.refreshDesktop();
    }, 200);

    this.physicsLoop = setInterval(() => {
      const locomotion = this.physics.update(50);
      const locomotionEnabled =
        !!this.lastSettings?.locomotion_enabled &&
        !!this.lastSettings &&
        !motionReduced(this.lastSettings);

      if (this.physics.isFalling()) {
        this.animation.setBase("fall");
      } else if (
        locomotionEnabled &&
        (locomotion === "walk" || locomotion === "run")
      ) {
        if (
          !this.animation.hasActiveOverlay ||
          ["sit", "walk", "run", "follow_cursor"].includes(this.animation.activity)
        ) {
          const next =
            this.physics.isFollowingCursor() && locomotion === "run"
              ? "run"
              : locomotion;
          this.animation.setBase(next);
        }
      } else if (
        !this.animation.hasActiveOverlay &&
        ["walk", "run", "fall"].includes(this.animation.activity)
      ) {
        this.animation.setBase("sit");
      }

      this.ambientTick += 50;
      if (this.character && this.lastSettings && this.ambientTick >= 500) {
        this.ambientTick = 0;
        this.ambient.tick(
          this.animation,
          this.physics,
          this.character,
          this.lastSettings,
          this.windowAnchor,
          (hide) => this.callbacks.onHideVisual?.(hide),
        );
      }

      this.systemCheckTick += 50;
      if (this.character && this.systemCheckTick >= 5000) {
        this.systemCheckTick = 0;
        void this.ambient.checkSystemEvents(this.animation, this.character);
      }
    }, 50);
  }

  stop() {
    if (this.physicsLoop) clearInterval(this.physicsLoop);
    if (this.desktopLoop) clearInterval(this.desktopLoop);
    this.input?.dispose();
    this.animation.dispose();
    this.spawner.dispose();
  }

  setCursorPosition(x: number, y: number) {
    const pos =
      this.character?.behaviors.multi_monitor_chase
        ? this.windowAnchor.clampCursorForMultiMonitor(x, y)
        : { x, y };
    this.physics.setCursorPosition(pos);
  }

  getPosition() {
    return this.physics.getState().position;
  }

  getActivity(): CharacterActivity {
    return this.animation.activity;
  }

  getVelocityX(): number {
    return this.physics.getVelocityX();
  }

  isHangMode(): boolean {
    return this.windowAnchor.isHangMode();
  }

  handlePointerDown(x: number, y: number) {
    this.ambient.touch();
    this.windowAnchor.setHideMode(false);
    this.callbacks.onHideVisual?.(false);
    this.input?.pointerDown({ x, y });
  }

  handlePointerUp(x: number, y: number) {
    this.ambient.touch();
    this.input?.pointerUp({ x, y });
  }

  feedTreat() {
    this.ambient.touch();
    this.animation.playOverlay("eat");
    if (this.character) {
      this.animation.playCelebrate(this.character.behaviors.celebrate);
    }
    this.callbacks.onSpeech?.("Yum! 🦴");
    this.spawnObjects("feed_treat");
  }

  private handleInteraction(event: InteractionEvent) {
    this.ambient.touch();
    const { action, level } = event;

    if (level === "single") {
      this.animation.playInteraction(action);
      this.callbacks.onSpeech?.(SPEECH_BY_ACTION[action] ?? "!");
      this.spawnObjects("single", action);
      return;
    }

    if (level === "double") {
      if (this.character) {
        const widgets = getDoubleClickWidgets(this.character);
        const pick = widgets[this.doubleClickIndex % widgets.length];
        this.doubleClickIndex += 1;
        this.callbacks.onWidgetOpen?.(pick.widget, pick.variant ?? null);
        this.callbacks.onSpeech?.(`Opening ${pick.label}...`);
        this.animation.playCelebrate(this.character.behaviors.celebrate);
        this.spawnObjects("double", action);
      }
      return;
    }

    if (level === "long_press") {
      this.ambient.touch();
      this.spawner.clear();
      this.callbacks.onActionMenuChange?.(true);
      this.callbacks.onSpeech?.("What should we do?");
      return;
    }
  }

  closeActionMenu() {
    this.callbacks.onActionMenuChange?.(false);
  }

  executeMenuAction(action: CompanionMenuAction) {
    this.ambient.touch();
    this.closeActionMenu();

    if (action.kind === "activity") {
      this.animation.forceBase(action.activity);
      this.callbacks.onSpeech?.(`${action.label}!`);
      return;
    }

    if (action.kind === "widget") {
      this.callbacks.onWidgetOpen?.(action.widget, action.variant ?? null);
      this.callbacks.onSpeech?.(`Opening ${action.label}...`);
      if (this.character) {
        this.animation.playCelebrate(this.character.behaviors.celebrate);
      }
      return;
    }

    if (action.kind === "spawn") {
      this.spawnSingleObject(action.spawnType);
      this.callbacks.onSpeech?.(`${action.label} ready!`);
    }
  }

  private spawnSingleObject(type: SpawnObjectType) {
    if (!this.character) return;
    this.spawner.clear();
    this.animation.playOverlay("jump");
    this.spawner.spawn(
      type,
      this.character.id,
      { x: -90, y: -140 },
      spawnPayload(type, this.character),
      "character",
    );
  }

  private spawnObjects(
    level: "single" | "double" | "long_press" | "feed_treat",
    action?: string,
    screenPosition?: { x: number; y: number },
  ) {
    if (!this.character) return;
    const types = spawnForInteraction(this.character, level, action);
    if (!types.length) return;

    this.animation.playOverlay("jump");
    const charPos = this.getPosition();

    types.forEach((type, index) => {
      const offset = {
        x: -90 + index * 36,
        y: -140 - index * 24,
      };
      const desktopPos = screenPosition
        ? {
            x: screenPosition.x - charPos.x - 90 + index * 40,
            y: screenPosition.y - charPos.y - 20 - index * 30,
          }
        : offset;

      this.spawner.spawn(
        type,
        this.character!.id,
        level === "long_press" ? desktopPos : offset,
        spawnPayload(type, this.character!, action),
        "character",
      );
    });
  }

  resize(width: number, height: number) {
    this.physics.setBounds(width, height);
    if (this.lastSettings) {
      this.applyCompanionSettings(this.lastSettings);
    }
  }
}

export async function getCursorPosition(): Promise<{ x: number; y: number }> {
  const [x, y] = await invoke<[number, number]>("get_cursor_position");
  return { x, y };
}

export async function setupOverlayWindow() {
  await invoke("setup_overlay_window");
}

export async function setOverlayClickthrough(ignore: boolean) {
  await invoke("set_overlay_clickthrough", { ignore });
}

export async function setOverlayHitRegion(
  circles: { x: number; y: number; radius: number }[],
  forceInteractive: boolean,
) {
  await invoke("set_overlay_hit_region", { circles, forceInteractive });
}
