import { invoke } from "@tauri-apps/api/core";
import { mergeSettings, percentToPosition, motionReduced } from "@/character/companionSettings";
import { AnimationController } from "./AnimationController";
import { InputHandler } from "./InputHandler";
import { ObjectSpawner, SPAWN_LABELS } from "./ObjectSpawner";
import { PhysicsController } from "./PhysicsController";
import type {
  AppSettings,
  CharacterDefinition,
  InteractionEvent,
  WidgetType,
} from "@/types/character";
import type { CharacterActivity } from "@/types/character";

export interface CharacterEngineCallbacks {
  onActivityChange?: (activity: CharacterActivity) => void;
  onSpeech?: (text: string | null) => void;
  onWidgetOpen?: (widget: WidgetType | null) => void;
  onSpawnedObjectsChange?: ReturnType<ObjectSpawner["subscribe"]> extends (
    cb: infer C,
  ) => unknown
    ? C
    : never;
}

const WIDGET_MAP: Record<string, WidgetType> = {
  open_quick_notes: "quick_notes",
  open_clipboard: "clipboard_history",
  open_journal: "journal",
  open_search: "ai_search",
  hologram_dashboard: "ai_search",
  open_trading_chart: "trading_chart",
  open_vault: "vault",
  fetch_note: "quick_notes",
  collect_screenshots: "clipboard_history",
};

const SPEECH_MAP: Record<string, string> = {
  bark: "Woof! 🐕",
  nibble: "*nibble nibble*",
  wave: "Hello! ✨",
  glow: "Ready to help.",
  fire_puff: "*tiny fire puff* 🔥",
  cherry_blossom_dance: "🌸",
  hologram_dashboard: "Summoning dashboard...",
  fetch_note: "Fetched your note!",
};

export class CharacterEngine {
  readonly animation: AnimationController;
  readonly physics: PhysicsController;
  readonly spawner: ObjectSpawner;
  private input: InputHandler | null = null;
  private character: CharacterDefinition | null = null;
  private physicsLoop: ReturnType<typeof setInterval> | null = null;
  private callbacks: CharacterEngineCallbacks;
  private lastSettings: AppSettings | null = null;

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
    });
  }

  loadCharacter(character: CharacterDefinition, settings: AppSettings) {
    this.character = character;
    this.lastSettings = settings;
    this.input?.dispose();
    this.input = new InputHandler(
      character.id,
      character.interactions,
      (event) => this.handleInteraction(event),
    );
    this.applyCompanionSettings(settings);
    this.animation.setBase("sit");
  }

  applyCompanionSettings(settings: AppSettings) {
    const merged = mergeSettings(settings);
    this.lastSettings = merged;
    const reduced = motionReduced(merged);
    const anchor = percentToPosition(
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

      if (effectiveFollow) {
        void getCursorPosition().then((pos) => {
          this.physics.setCursorPosition(pos);
        });
      }
    } else {
      this.physics.setPosition(anchor);
    }
  }

  start() {
    this.physicsLoop = setInterval(() => {
      const locomotion = this.physics.update(50);
      const locomotionEnabled =
        !!this.lastSettings?.locomotion_enabled &&
        !!this.lastSettings &&
        !motionReduced(this.lastSettings);

      if (
        locomotionEnabled &&
        (locomotion === "walk" || locomotion === "run")
      ) {
        if (
          this.animation.activity === "sit" ||
          this.animation.activity === "walk" ||
          this.animation.activity === "run"
        ) {
          this.animation.setBase(locomotion);
        }
      } else if (
        !this.animation.activity ||
        ["walk", "run"].includes(this.animation.activity)
      ) {
        this.animation.setBase("sit");
      }
    }, 50);
  }

  stop() {
    if (this.physicsLoop) clearInterval(this.physicsLoop);
    this.input?.dispose();
    this.animation.dispose();
    this.spawner.dispose();
  }

  setCursorPosition(x: number, y: number) {
    this.physics.setCursorPosition({ x, y });
  }

  getPosition() {
    return this.physics.getState().position;
  }

  getActivity(): CharacterActivity {
    return this.animation.activity;
  }

  handlePointerDown(x: number, y: number) {
    this.input?.pointerDown({ x, y });
  }

  handlePointerUp(x: number, y: number) {
    this.input?.pointerUp({ x, y });
  }

  feedTreat() {
    this.animation.playOverlay("eat");
    this.callbacks.onSpeech?.("Yum! 🦴");
    if (this.character) {
      this.spawner.spawn(
        "sticky_note",
        this.character.id,
        { x: -90, y: -140 },
        { text: "Treat time!", stub: true },
        "character",
      );
    }
  }

  private handleInteraction(event: InteractionEvent) {
    const { action, level, screenPosition } = event;

    if (level === "single") {
      this.animation.playInteraction(action);
      this.callbacks.onSpeech?.(SPEECH_MAP[action] ?? "!");
      return;
    }

    if (level === "double") {
      const widget = WIDGET_MAP[action];
      if (widget) {
        this.callbacks.onWidgetOpen?.(widget);
        this.callbacks.onSpeech?.(`Opening ${widget.replace("_", " ")}...`);
      }
      return;
    }

    if (level === "long_press") {
      this.animation.playInteraction(action);
      const widget = WIDGET_MAP[action];
      if (widget) this.callbacks.onWidgetOpen?.(widget);

      if (this.character && this.character.spawn_objects[0]) {
        const type = this.character.spawn_objects[0];
        const charPos = this.getPosition();
        this.spawner.spawn(
          type,
          this.character.id,
          {
            x: screenPosition.x - charPos.x - 90,
            y: screenPosition.y - charPos.y - 20,
          },
          {
            stub: true,
            label: SPAWN_LABELS[type],
          },
          "character",
        );
      }
      this.callbacks.onSpeech?.(SPEECH_MAP[action] ?? "Special!");
    }
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
