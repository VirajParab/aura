import { invoke } from "@tauri-apps/api/core";
import { motionReduced } from "@/character/companionSettings";
import type { AnimationController } from "./AnimationController";
import { mapAmbientToActivity } from "./activityPose";
import type { PhysicsController } from "./PhysicsController";
import type { WindowAnchorSystem } from "./WindowAnchorSystem";
import type { AppSettings, CharacterDefinition } from "@/types/character";

const AMBIENT_INTERVAL_MS = 12_000;
const SLEEP_IDLE_MS = 30 * 60 * 1000;
const CPU_SPIKE_THRESHOLD = 80;

interface SystemStats {
  cpu_usage_percent: number;
}

export class AmbientController {
  private lastAmbientAt = Date.now();
  private lastInputAt = Date.now();
  private lastCpuSpikeAt = 0;
  private patrolTarget: number | null = null;

  touch() {
    this.lastInputAt = Date.now();
  }

  tick(
    animation: AnimationController,
    physics: PhysicsController,
    character: CharacterDefinition,
    settings: AppSettings,
    windowAnchor: WindowAnchorSystem,
    onHideVisual?: (hide: boolean) => void,
  ) {
    if (motionReduced(settings)) return;
    if (animation.hasActiveOverlay) return;

    const now = Date.now();
    const moving = physics.isMoving() || physics.isFalling();

    if (moving) {
      this.patrolTarget = null;
      windowAnchor.setHideMode(false);
      onHideVisual?.(false);
      return;
    }

    if (now - this.lastInputAt > SLEEP_IDLE_MS) {
      if (animation.baseActivity !== "sleep") {
        animation.playIdleSleep(character.behaviors.idle_sleep);
      }
      return;
    }

    if (animation.baseActivity === "sleep" && now - this.lastInputAt < SLEEP_IDLE_MS) {
      animation.forceBase("sit");
    }

    if (now - this.lastAmbientAt < AMBIENT_INTERVAL_MS) return;

    const ambient = this.pickAmbient(character, settings);
    if (!ambient) return;

    this.lastAmbientAt = now;

    if (ambient === "follow_cursor") {
      this.startPatrol(physics, settings, character);
      return;
    }

    if (ambient === "roll") {
      animation.playOverlay("roll");
      return;
    }

    if (ambient === "climb_window_edge" && character.window_physics.can_hang) {
      animation.playOverlay("peek");
      return;
    }

    const activity = mapAmbientToActivity(ambient);
    if (!activity) return;

    if (activity === "walk") {
      this.startPatrol(physics, settings, character);
      return;
    }

    if (activity === "hide" && character.window_physics.can_hide_behind) {
      windowAnchor.setHideMode(true);
      onHideVisual?.(true);
      animation.playOverlay("hide");
      return;
    }

    if (["look_around", "read", "think", "hide", "peek", "sit"].includes(activity)) {
      animation.playOverlay(activity);
      return;
    }

    animation.setBase(activity);
  }

  async checkSystemEvents(animation: AnimationController, character: CharacterDefinition) {
    const now = Date.now();
    if (now - this.lastCpuSpikeAt < 15_000) return;

    try {
      const stats = await invoke<SystemStats>("get_system_stats_cmd");
      if (stats.cpu_usage_percent > CPU_SPIKE_THRESHOLD) {
        this.lastCpuSpikeAt = now;
        if (character.special_tricks.some((t) => t.includes("wheel"))) {
          animation.playOverlay("roll");
        } else {
          animation.playOverlay("think");
        }
      }
    } catch {
      // outside Tauri
    }
  }

  private pickAmbient(
    character: CharacterDefinition,
    settings: AppSettings,
  ): string | "roll" | "climb_window_edge" | null {
    const pool = [...character.behaviors.ambient];
    const effectiveFollow =
      settings.follow_cursor && character.behaviors.follow_cursor;

    const filtered = pool.filter((a) => {
      if (a === "follow_cursor" && effectiveFollow) return false;
      return true;
    });

    if (character.special_tricks.includes("climb_window_edge") && Math.random() < 0.12) {
      return "climb_window_edge";
    }

    if (
      character.category === "cute_animals" &&
      Math.random() < 0.15 &&
      character.id === "mochi"
    ) {
      return "roll";
    }

    if (filtered.length === 0) return "sit";
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  private startPatrol(
    physics: PhysicsController,
    settings: AppSettings,
    character: CharacterDefinition,
  ) {
    if (!settings.locomotion_enabled || motionReduced(settings)) return;

    const state = physics.getState();
    const margin = 80;
    const maxX = window.innerWidth - margin;
    const minX = margin;

    if (this.patrolTarget === null || Math.abs(state.position.x - this.patrolTarget) < 8) {
      let next = minX + Math.random() * (maxX - minX);
      if (Math.abs(next - state.position.x) < 120) {
        next = state.position.x < window.innerWidth / 2 ? maxX - 40 : minX + 40;
      }
      this.patrolTarget = next;
    }

    physics.moveTo({
      x: this.patrolTarget,
      y: state.position.y,
    });

    if (character.special_tricks.includes("multi_monitor_chase")) {
      // cursor follow handles active chase; patrol fills idle gaps
    }
  }
}
