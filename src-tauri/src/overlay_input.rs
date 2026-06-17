use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[cfg(not(target_os = "linux"))]
use device_query::{DeviceQuery, DeviceState};
#[cfg(not(target_os = "linux"))]
use tauri::{CursorIcon, Emitter, Manager, PhysicalPosition, WebviewWindow};

#[cfg(target_os = "linux")]
use crate::overlay_input_linux::{apply_input_shape_for_app, is_linux_session};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HitCircle {
    pub x: f64,
    pub y: f64,
    pub radius: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OverlayHitRegion {
    pub circles: Vec<HitCircle>,
    pub force_interactive: bool,
}

pub struct OverlayInputState {
    pub region: OverlayHitRegion,
    #[cfg(not(target_os = "linux"))]
    poll: PollState,
}

#[cfg(not(target_os = "linux"))]
#[derive(Default)]
struct PollState {
    last_left_down: bool,
    last_hit: bool,
    last_hovering: bool,
}

impl Default for OverlayInputState {
    fn default() -> Self {
        Self {
            region: OverlayHitRegion::default(),
            #[cfg(not(target_os = "linux"))]
            poll: PollState::default(),
        }
    }
}

pub fn overlay_uses_dom_input() -> bool {
    #[cfg(target_os = "linux")]
    {
        return is_linux_session();
    }
    #[cfg(not(target_os = "linux"))]
    {
        false
    }
}

pub fn update_overlay_hit_region(
    app: &AppHandle,
    state: &Mutex<OverlayInputState>,
    region: OverlayHitRegion,
) {
    if let Ok(mut s) = state.lock() {
        s.region = region.clone();
    }

    #[cfg(target_os = "linux")]
    apply_input_shape_for_app(app, &region);
}

pub fn spawn_overlay_input_loop(app: AppHandle, state: Arc<Mutex<OverlayInputState>>) {
    #[cfg(target_os = "linux")]
    {
        let _ = (app, state);
        return;
    }

    #[cfg(not(target_os = "linux"))]
    spawn_overlay_input_poll_loop(app, state);
}

#[cfg(not(target_os = "linux"))]
fn cursor_hit_circles(region: &OverlayHitRegion, lx: f64, ly: f64) -> bool {
    region.circles.iter().any(|c| {
        if c.radius <= 0.0 {
            return false;
        }
        let dx = lx - c.x;
        let dy = ly - c.y;
        dx * dx + dy * dy <= c.radius * c.radius
    })
}

#[cfg(not(target_os = "linux"))]
fn cursor_local_in_overlay(overlay: &WebviewWindow) -> Option<(f64, f64)> {
    let cursor: PhysicalPosition<f64> = overlay.cursor_position().ok()?;
    let pos = overlay.outer_position().ok()?;
    let scale = overlay.scale_factor().unwrap_or(1.0);
    let lx = (cursor.x - pos.x as f64) / scale;
    let ly = (cursor.y - pos.y as f64) / scale;
    Some((lx, ly))
}

#[cfg(not(target_os = "linux"))]
fn spawn_overlay_input_poll_loop(app: AppHandle, state: Arc<Mutex<OverlayInputState>>) {
    std::thread::spawn(move || {
        let device_state = DeviceState::new();
        loop {
            std::thread::sleep(std::time::Duration::from_millis(12));

            let mouse = device_state.get_mouse();
            let left_down = mouse
                .button_pressed
                .get(1)
                .copied()
                .unwrap_or(false);

            let app_tick = app.clone();
            let state_tick = Arc::clone(&state);

            let _ = app.run_on_main_thread(move || {
                let Some(overlay) = app_tick.get_webview_window("overlay") else {
                    return;
                };

                let Some((lx, ly)) = cursor_local_in_overlay(&overlay) else {
                    return;
                };

                let (interactive, emit_down, emit_up, hovering, hover_changed) = {
                    let Ok(mut input) = state_tick.lock() else {
                        return;
                    };
                    let hit = cursor_hit_circles(&input.region, lx, ly);
                    let interactive = hit || input.region.force_interactive;
                    let emit_down = left_down && !input.poll.last_left_down && hit;
                    let emit_up = !left_down && input.poll.last_left_down && input.poll.last_hit;
                    let hover_changed = hit != input.poll.last_hovering;
                    input.poll.last_left_down = left_down;
                    input.poll.last_hit = hit;
                    input.poll.last_hovering = hit;
                    (interactive, emit_down, emit_up, hit, hover_changed)
                };

                let _ = overlay.set_always_on_top(true);
                let _ = overlay.set_ignore_cursor_events(!interactive);

                let cursor = if hovering {
                    CursorIcon::Hand
                } else {
                    CursorIcon::Default
                };
                let _ = overlay.set_cursor_icon(cursor);

                if emit_down {
                    let _ = app_tick.emit(
                        "companion-pointer",
                        serde_json::json!({
                            "phase": "down",
                            "x": lx.round() as i32,
                            "y": ly.round() as i32,
                        }),
                    );
                }
                if emit_up {
                    let _ = app_tick.emit(
                        "companion-pointer",
                        serde_json::json!({
                            "phase": "up",
                            "x": lx.round() as i32,
                            "y": ly.round() as i32,
                        }),
                    );
                }

                if hover_changed {
                    let _ = app_tick.emit(
                        "companion-hover",
                        serde_json::json!({ "hovering": hovering }),
                    );
                }
            });
        }
    });
}
