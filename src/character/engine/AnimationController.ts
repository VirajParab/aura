import type { CharacterActivity } from "@/types/character";

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

  subscribe(listener: ActivityListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(next: CharacterActivity) {
    const prev = this.activity;
    this.listeners.forEach((l) => l(next, prev));
  }

  setBase(activity: CharacterActivity) {
    if (this.overlay) return;
    this.base = activity;
    this.current = activity;
    this.emit(activity);
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
    const map: Record<string, CharacterActivity> = {
      bark: "wave",
      nibble: "eat",
      wave: "wave",
      glow: "think",
      fire_puff: "celebrate",
      cherry_blossom_dance: "dance",
      hologram_dashboard: "think",
      fetch_note: "celebrate",
    };
    this.playOverlay(map[animationName] ?? "wave");
  }

  dispose() {
    if (this.overlayTimer) clearTimeout(this.overlayTimer);
    this.listeners.clear();
  }
}
