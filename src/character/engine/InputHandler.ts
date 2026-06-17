import type { InteractionEvent, InteractionLevel } from "@/types/character";

const LONG_PRESS_MS = 800;
const DOUBLE_CLICK_MS = 300;

export type InteractionCallback = (event: InteractionEvent) => void;

export class InputHandler {
  private lastClickTime = 0;
  private clickCount = 0;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTriggered = false;
  private onInteract: InteractionCallback;
  private characterId: string;
  private interactions: {
    single_click: string;
    double_click: string;
    long_press: string;
  };

  constructor(
    characterId: string,
    interactions: {
      single_click: string;
      double_click: string;
      long_press: string;
    },
    onInteract: InteractionCallback,
  ) {
    this.characterId = characterId;
    this.interactions = interactions;
    this.onInteract = onInteract;
  }

  updateInteractions(interactions: {
    single_click: string;
    double_click: string;
    long_press: string;
  }) {
    this.interactions = interactions;
  }

  pointerDown(screenPosition: { x: number; y: number }) {
    this.longPressTriggered = false;
    this.longPressTimer = setTimeout(() => {
      this.longPressTriggered = true;
      this.fire("long_press", this.interactions.long_press, screenPosition);
    }, LONG_PRESS_MS);
  }

  pointerUp(screenPosition: { x: number; y: number }) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.longPressTriggered) return;

    const now = Date.now();
    if (now - this.lastClickTime < DOUBLE_CLICK_MS) {
      this.clickCount += 1;
    } else {
      this.clickCount = 1;
    }
    this.lastClickTime = now;

    if (this.clickCount >= 2) {
      this.clickCount = 0;
      this.fire("double", this.interactions.double_click, screenPosition);
    } else {
      setTimeout(() => {
        if (this.clickCount === 1) {
          this.clickCount = 0;
          this.fire("single", this.interactions.single_click, screenPosition);
        }
      }, DOUBLE_CLICK_MS);
    }
  }

  private fire(
    level: InteractionLevel,
    action: string,
    screenPosition: { x: number; y: number },
  ) {
    this.onInteract({
      level,
      action,
      characterId: this.characterId,
      screenPosition,
    });
  }

  dispose() {
    if (this.longPressTimer) clearTimeout(this.longPressTimer);
  }
}
