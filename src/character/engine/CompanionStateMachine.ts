import { invoke } from "@tauri-apps/api/core";
import type { CharacterActivity } from "@/types/character";

export type CompanionState =
  | "idle"
  | "coding"
  | "trading"
  | "meeting"
  | "sleeping"
  | "celebrating"
  | "warning"
  | "thinking";

interface ActiveWindow {
  title: string;
  app_name: string;
}

const CODING_APPS = ["code", "vscode", "cursor", "idea", "vim", "nvim", "emacs"];
const TRADING_APPS = ["tradingview", "metatrader", "zerodha", "kite", "binance"];
const MEETING_APPS = ["zoom", "meet", "teams", "slack huddle", "discord"];

export class CompanionStateMachine {
  private state: CompanionState = "idle";
  private codingSince: number | null = null;
  private listeners = new Set<(state: CompanionState, activity: CharacterActivity) => void>();

  get current(): CompanionState {
    return this.state;
  }

  subscribe(listener: (state: CompanionState, activity: CharacterActivity) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(activity: CharacterActivity) {
    this.listeners.forEach((l) => l(this.state, activity));
  }

  async poll() {
    try {
      const win = await invoke<ActiveWindow | null>("get_active_window_cmd");
      const label = `${win?.app_name ?? ""} ${win?.title ?? ""}`.toLowerCase();
      const next = this.inferState(label);
      if (next !== this.state) {
        this.state = next;
      }

      if (this.state === "coding") {
        if (!this.codingSince) this.codingSince = Date.now();
        if (this.codingSince && Date.now() - this.codingSince > 90 * 60 * 1000) {
          this.emit("stretch");
          this.codingSince = Date.now();
        }
      } else {
        this.codingSince = null;
      }

      this.emit(this.stateToActivity(this.state));
    } catch {
      // outside Tauri
    }
  }

  onAuraEvent(type: string) {
    if (type === "capture_saved" || type === "task_created" || type === "note_created") {
      this.state = "celebrating";
      this.emit("celebrate");
      setTimeout(() => {
        this.state = "idle";
        this.emit("sit");
      }, 2000);
      return;
    }
    if (type === "clipboard_copy") {
      this.emit("peek");
    }
  }

  forceThinking() {
    this.state = "thinking";
    this.emit("think");
  }

  private inferState(label: string): CompanionState {
    if (MEETING_APPS.some((a) => label.includes(a))) return "meeting";
    if (TRADING_APPS.some((a) => label.includes(a))) return "trading";
    if (CODING_APPS.some((a) => label.includes(a))) return "coding";
    return "idle";
  }

  private stateToActivity(state: CompanionState): CharacterActivity {
    const map: Record<CompanionState, CharacterActivity> = {
      idle: "sit",
      coding: "think",
      trading: "look_around",
      meeting: "sit",
      sleeping: "sleep",
      celebrating: "celebrate",
      warning: "cry",
      thinking: "think",
    };
    return map[state];
  }
}
