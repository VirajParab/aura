import type { CharacterActivity } from "@/types/character";

/** VRMA clip id (filename without extension) for each activity */
export const ACTIVITY_ANIMATION_CLIP: Partial<Record<CharacterActivity, string>> = {
  sit: "relax",
  idle: "relax",
  sleep: "sleepy",
  jump: "jump",
  wave: "goodbye",
  dance: "clapping",
  celebrate: "clapping",
  cry: "sad",
  think: "thinking",
  look_around: "look_around",
  read: "thinking",
  eat: "surprised",
  fall: "jump",
  roll: "jump",
  peek: "surprised",
  stretch: "relax",
  hide: "relax",
};

/** Activities that use procedural leg animation instead of VRMA */
export const PROCEDURAL_LOCOMOTION_ACTIVITIES = new Set<CharacterActivity>([
  "walk",
  "run",
  "follow_cursor",
]);

export function isLoopingActivity(activity: CharacterActivity): boolean {
  if (PROCEDURAL_LOCOMOTION_ACTIVITIES.has(activity)) return true;
  return ["sit", "idle", "sleep", "look_around", "think", "read", "dance", "cry", "hide", "stretch"].includes(
    activity,
  );
}

export const SHARED_ANIMATION_IDS = [
  "relax",
  "sleepy",
  "goodbye",
  "jump",
  "look_around",
  "clapping",
  "sad",
  "thinking",
  "surprised",
  "angry",
] as const;

export type SharedAnimationId = (typeof SHARED_ANIMATION_IDS)[number];
