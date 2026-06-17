import type { CharacterActivity } from "@/types/character";
import {
  CELEBRATE_ACTIVITY_MAP,
  IDLE_SLEEP_ACTIVITY_MAP,
  INTERACTION_ACTIVITY_MAP,
} from "./characterPlatform";

export const CORE_ACTIVITIES: CharacterActivity[] = [
  "sit",
  "sleep",
  "walk",
  "run",
  "jump",
  "wave",
  "dance",
  "fall",
  "roll",
  "look_around",
  "follow_cursor",
  "celebrate",
  "cry",
  "think",
  "read",
  "eat",
  "stretch",
  "hide",
  "peek",
];

const ACTIVITY_DURATION_MS: Partial<Record<CharacterActivity, number>> = {
  wave: 1000,
  jump: 800,
  celebrate: 2000,
  cry: 2000,
  dance: 3000,
  eat: 1500,
  peek: 1000,
  roll: 1500,
  stretch: 2000,
  look_around: 2500,
  read: 3000,
  think: 3000,
  hide: 2000,
};

type ActivityListener = (activity: CharacterActivity, prev: CharacterActivity) => void;

export class AnimationController {
  private current: CharacterActivity = "sit";
  private base: CharacterActivity = "sit";
  private overlay: CharacterActivity | null = null;
  private overlayTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<ActivityListener>();

  get activity(): CharacterActivity {
    return this.overlay ?? this.current;
  }

  get baseActivity(): CharacterActivity {
    return this.base;
  }

  get hasActiveOverlay(): boolean {
    return this.overlay !== null;
  }

  subscribe(listener: ActivityListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(next: CharacterActivity) {
    const prev = this.activity;
    this.listeners.forEach((l) => l(next, prev));
  }

  forceBase(activity: CharacterActivity) {
    if (this.overlayTimer) clearTimeout(this.overlayTimer);
    this.overlay = null;
    this.base = activity;
    this.current = activity;
    this.emit(activity);
  }

  setBase(activity: CharacterActivity) {
    if (this.overlay) return;
    this.forceBase(activity);
  }

  playOverlay(activity: CharacterActivity) {
    if (this.overlayTimer) clearTimeout(this.overlayTimer);
    this.overlay = activity;
    this.emit(activity);

    const duration = ACTIVITY_DURATION_MS[activity] ?? 1200;
    this.overlayTimer = setTimeout(() => {
      this.overlay = null;
      this.current = this.base;
      this.emit(this.current);
    }, duration);
  }

  playInteraction(animationName: string) {
    this.playOverlay(INTERACTION_ACTIVITY_MAP[animationName] ?? "wave");
  }

  playCelebrate(behaviorName: string) {
    this.playOverlay(CELEBRATE_ACTIVITY_MAP[behaviorName] ?? "celebrate");
  }

  playIdleSleep(sleepName: string) {
    this.forceBase(IDLE_SLEEP_ACTIVITY_MAP[sleepName] ?? "sleep");
  }

  dispose() {
    if (this.overlayTimer) clearTimeout(this.overlayTimer);
    this.listeners.clear();
  }
}
