import type { CharacterActivity } from "@/types/character";

export interface PoseContext {
  timeMs: number;
  activityElapsedMs: number;
  velocityX: number;
  moving: boolean;
  upsideDown?: boolean;
  hanging?: boolean;
  floating?: boolean;
}

export interface ActivityTransform {
  offsetX: number;
  offsetY: number;
  rotationZ: number;
  rotationY: number;
  scaleX: number;
  scaleY: number;
}

const TAU = Math.PI * 2;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) {
    t -= 1.5 / 2.75;
    return 7.5625 * t * t + 0.75;
  }
  if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75;
    return 7.5625 * t * t + 0.9375;
  }
  t -= 2.625 / 2.75;
  return 7.5625 * t * t + 0.984375;
}

export function computeActivityTransform(
  activity: CharacterActivity,
  ctx: PoseContext,
): ActivityTransform {
  const t = ctx.timeMs / 1000;
  const e = ctx.activityElapsedMs / 1000;
  const face = ctx.velocityX >= 0 ? 1 : -1;
  const base: ActivityTransform = {
    offsetX: 0,
    offsetY: 0,
    rotationZ: 0,
    rotationY: face > 0 ? 0 : Math.PI,
    scaleX: 1,
    scaleY: 1,
  };

  switch (activity) {
    case "sit":
    case "idle": {
      const floatY = ctx.floating ? Math.sin(t * 1.8) * 6 - 4 : Math.sin(t * 2.5) * 3;
      return {
        ...base,
        offsetY: floatY,
        rotationZ: Math.sin(t * 1.2) * 0.04,
      };
    }

    case "sleep": {
      if (ctx.upsideDown || ctx.hanging) {
        return {
          ...base,
          offsetY: -12,
          rotationZ: Math.PI,
          scaleX: 0.9,
          scaleY: 0.88,
        };
      }
      return {
        ...base,
        offsetY: 8,
        rotationZ: 0.25,
        scaleX: 0.92,
        scaleY: 0.88,
      };
    }

    case "walk":
      return {
        ...base,
        offsetY: Math.abs(Math.sin(t * 8)) * 6,
        rotationZ: lerp(0, 0.08 * face, 0.6),
        scaleY: 1 + Math.sin(t * 8) * 0.03,
      };

    case "run":
      return {
        ...base,
        offsetY: Math.abs(Math.sin(t * 14)) * 10,
        rotationZ: 0.12 * face,
        scaleY: 1 + Math.sin(t * 14) * 0.05,
        scaleX: 1.02,
      };

    case "follow_cursor":
      return {
        ...base,
        offsetY: Math.sin(t * 6) * 4,
        rotationZ: 0.06 * face,
      };

    case "jump": {
      const progress = Math.min(1, e / 0.7);
      const arc = Math.sin(progress * Math.PI) * 28;
      return {
        ...base,
        offsetY: -arc,
        scaleY: 1 + Math.sin(progress * Math.PI) * 0.08,
      };
    }

    case "wave":
      return {
        ...base,
        rotationZ: Math.sin(t * 10) * 0.18,
        offsetY: Math.sin(t * 10) * 2,
      };

    case "dance": {
      const beat = Math.sin(t * 6);
      return {
        ...base,
        offsetY: Math.abs(beat) * 12,
        rotationZ: Math.sin(t * 4) * 0.2,
        scaleX: 1 + beat * 0.05,
      };
    }

    case "fall": {
      const progress = Math.min(1, e / 0.5);
      return {
        ...base,
        offsetY: progress * 40,
        rotationZ: progress * 0.6 * face,
        scaleY: 1 - progress * 0.1,
      };
    }

    case "roll": {
      const progress = Math.min(1, e / 1.5);
      return {
        ...base,
        rotationZ: progress * TAU * face,
        offsetY: Math.sin(progress * Math.PI) * -10,
      };
    }

    case "look_around":
      return {
        ...base,
        rotationY: base.rotationY + Math.sin(t * 1.5) * 0.55,
        offsetY: Math.sin(t * 2) * 2,
      };

    case "celebrate": {
      const progress = Math.min(1, e / 2);
      const bounce = easeOutBounce(progress) * 22;
      return {
        ...base,
        offsetY: -Math.sin(progress * Math.PI * 3) * bounce * 0.35,
        rotationZ: Math.sin(t * 12) * 0.15,
        scaleY: 1 + Math.sin(t * 12) * 0.06,
      };
    }

    case "cry":
      return {
        ...base,
        offsetY: 10,
        rotationZ: -0.12,
        scaleY: 0.9,
      };

    case "think":
      return {
        ...base,
        rotationZ: -0.08,
        rotationY: base.rotationY + 0.15,
        offsetY: Math.sin(t * 1.8) * 2,
      };

    case "read":
      return {
        ...base,
        rotationZ: 0.1,
        offsetY: 4,
        scaleX: 0.96,
      };

    case "eat": {
      const munch = Math.sin(t * 12);
      return {
        ...base,
        offsetY: Math.abs(munch) * 8,
        rotationZ: munch * 0.06,
        scaleY: 1 + Math.max(0, munch) * 0.04,
      };
    }

    case "stretch": {
      const pulse = Math.sin(Math.min(1, e / 2) * Math.PI);
      return {
        ...base,
        offsetY: -pulse * 6,
        scaleY: 1 + pulse * 0.15,
        scaleX: 1 - pulse * 0.05,
      };
    }

    case "hide":
      return {
        ...base,
        offsetX: -18 * face,
        scaleX: 0.55,
        scaleY: 0.7,
        rotationZ: 0.15 * face,
      };

    case "peek": {
      const pop = Math.sin(Math.min(1, e / 1) * Math.PI);
      return {
        ...base,
        offsetX: 12 * face,
        offsetY: -pop * 16,
        rotationY: base.rotationY + 0.35 * face,
      };
    }

    default:
      return base;
  }
}

export function mapAmbientToActivity(ambient: string): CharacterActivity | null {
  const map: Record<string, CharacterActivity> = {
    sit: "sit",
    look_around: "look_around",
    read: "read",
    think: "think",
    hide: "hide",
    peek: "peek",
    sleep_curled: "sleep",
    follow_cursor: "walk",
  };
  return map[ambient] ?? null;
}
