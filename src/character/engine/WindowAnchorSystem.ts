import { invoke } from "@tauri-apps/api/core";
import { availableMonitors, primaryMonitor, type Monitor } from "@tauri-apps/api/window";
import { percentToPosition } from "@/character/companionSettings";
import type { AppSettings, CharacterDefinition, CharacterScreenPosition } from "@/types/character";

export interface MonitorInfo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scale_factor: number;
  is_primary: boolean;
}

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopWindow {
  id: number;
  title: string;
  app_name: string;
  rect: WindowRect;
  z_order: number;
  is_minimized: boolean;
  monitor_id: number;
}

export interface DesktopState {
  windows: DesktopWindow[];
  monitors: MonitorInfo[];
  cursor: { x: number; y: number; monitor_id: number };
  active_window_id: number | null;
}

const TASKBAR_INSET = 56;
const TITLE_BAR_INSET = 28;

export class WindowAnchorSystem {
  private desktop: DesktopState | null = null;
  private globalBounds = { minX: 0, maxX: window.innerWidth, anchorY: window.innerHeight - 80 };
  private hangMode = false;
  private hideMode = false;

  async refresh(): Promise<DesktopState | null> {
    try {
      const monitors = await this.readMonitors();
      const desktop = await invoke<DesktopState>("get_desktop_state", { monitors });
      this.desktop = desktop;
      this.recomputeBounds(desktop);
      return desktop;
    } catch {
      return null;
    }
  }

  getAnchorPosition(
    character: CharacterDefinition,
    settings: AppSettings,
    viewportW: number,
    viewportH: number,
  ): CharacterScreenPosition {
    const base = percentToPosition(
      settings.position_x_percent,
      settings.position_y_percent,
      viewportW,
      viewportH,
    );

    if (!this.desktop) return base;

    const preferred = character.window_physics.preferred_anchors;
    const windows = this.desktop.windows.filter((w) => !w.is_minimized);

    if (preferred.includes("title_bar") && character.window_physics.can_hang) {
      const topWindow = windows.sort((a, b) => a.rect.y - b.rect.y)[0];
      if (topWindow) {
        this.hangMode = true;
        return {
          x: Math.min(Math.max(base.x, topWindow.rect.x + 40), topWindow.rect.x + topWindow.rect.width - 40),
          y: topWindow.rect.y + TITLE_BAR_INSET,
        };
      }
    }

    if (preferred.includes("window_border") && windows.length > 0) {
      const nearest = this.nearestWindow(base.x, windows);
      if (nearest) {
        return {
          x: Math.min(Math.max(base.x, nearest.rect.x + 20), nearest.rect.x + nearest.rect.width - 20),
          y: nearest.rect.y + TITLE_BAR_INSET,
        };
      }
    }

    if (preferred.includes("window_corner") && character.window_physics.can_hang && windows.length > 0) {
      const corner = windows[0];
      this.hangMode = true;
      return {
        x: corner.rect.x + corner.rect.width - 48,
        y: corner.rect.y + TITLE_BAR_INSET,
      };
    }

    if (preferred.includes("taskbar")) {
      return { x: base.x, y: viewportH - TASKBAR_INSET };
    }

    if (preferred.includes("screen_edge")) {
      return { x: base.x, y: viewportH - TASKBAR_INSET };
    }

    return base;
  }

  clampCursorForMultiMonitor(x: number, _y: number): CharacterScreenPosition {
    if (!this.desktop?.monitors.length) {
      return {
        x: Math.max(40, Math.min(this.globalBounds.maxX - 40, x)),
        y: this.globalBounds.anchorY,
      };
    }

    const monitors = this.desktop.monitors;
    const primary = monitors.find((m) => m.is_primary) ?? monitors[0];
    const globalX = Math.max(
      primary.x + 40,
      Math.min(primary.x + primary.width - 40, x),
    );

    return { x: globalX, y: this.globalBounds.anchorY };
  }

  getGlobalBounds() {
    return { ...this.globalBounds };
  }

  isHangMode(): boolean {
    return this.hangMode;
  }

  setHideMode(hide: boolean) {
    this.hideMode = hide;
    this.hangMode = false;
  }

  isHideMode(): boolean {
    return this.hideMode;
  }

  shouldFall(previousY: number, nextY: number): boolean {
    return Math.abs(previousY - nextY) > 24;
  }

  private async readMonitors(): Promise<MonitorInfo[]> {
    try {
      const list = await availableMonitors();
      const primary = await primaryMonitor();
      return list.map((m: Monitor, index: number) => {
        const pos = m.position;
        const size = m.size;
        const scale = m.scaleFactor;
        return {
          id: index,
          x: Math.round(pos.x),
          y: Math.round(pos.y),
          width: Math.round(size.width),
          height: Math.round(size.height),
          scale_factor: scale,
          is_primary: primary?.name === m.name,
        };
      });
    } catch {
      return [
        {
          id: 0,
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          scale_factor: window.devicePixelRatio,
          is_primary: true,
        },
      ];
    }
  }

  private recomputeBounds(desktop: DesktopState) {
    const monitors = desktop.monitors;
    if (!monitors.length) return;

    const minX = Math.min(...monitors.map((m) => m.x));
    const maxX = Math.max(...monitors.map((m) => m.x + m.width));
    const primary = monitors.find((m) => m.is_primary) ?? monitors[0];
    this.globalBounds = {
      minX,
      maxX,
      anchorY: primary.y + primary.height - TASKBAR_INSET,
    };
  }

  private nearestWindow(x: number, windows: DesktopWindow[]): DesktopWindow | null {
    if (!windows.length) return null;
    return windows.reduce((best, w) => {
      const cx = w.rect.x + w.rect.width / 2;
      const bestCx = best.rect.x + best.rect.width / 2;
      return Math.abs(cx - x) < Math.abs(bestCx - x) ? w : best;
    });
  }
}
