mod character;
mod db;
mod system;
mod window;

use character::{get_character, load_manifest, CharacterDefinition, CharacterManifest};
use db::{init_db, load_settings, save_settings, AppSettings};
use std::path::PathBuf;
use std::sync::Mutex;
use system::get_system_stats;
use tauri::{Manager, State};
use window::{get_default_anchor, get_visible_windows, CursorPosition, DesktopState, MonitorInfo};

struct AppState {
    db: Mutex<rusqlite::Connection>,
    resource_dir: PathBuf,
}

#[tauri::command]
fn get_character_manifest(state: State<'_, AppState>) -> Result<CharacterManifest, String> {
    load_manifest(&state.resource_dir).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_character_by_id(state: State<'_, AppState>, id: String) -> Result<CharacterDefinition, String> {
    get_character(&state.resource_dir, &id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_app_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    load_settings(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_app_settings(state: State<'_, AppState>, settings: AppSettings) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    save_settings(&conn, &settings).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_desktop_state(monitors: Vec<MonitorInfo>) -> DesktopState {
    let windows = get_visible_windows();
    let anchor = get_default_anchor(&monitors);
    DesktopState {
        windows,
        monitors: monitors.clone(),
        cursor: CursorPosition {
            x: anchor.as_ref().map(|a| a.position.0).unwrap_or(0),
            y: anchor.as_ref().map(|a| a.position.1).unwrap_or(0),
            monitor_id: anchor.as_ref().map(|a| a.monitor_id).unwrap_or(0),
        },
        active_window_id: None,
    }
}

#[tauri::command]
fn get_system_stats_cmd() -> system::monitor::SystemStats {
    get_system_stats()
}

#[tauri::command]
fn get_cursor_position() -> (i32, i32) {
    // Phase 1: requires libx11 for device_query on Linux.
    // Frontend falls back to character anchor position until OS cursor API is wired.
    (0, 0)
}

#[tauri::command]
async fn setup_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::LogicalSize;

    if let Some(overlay) = app.get_webview_window("overlay") {
        if let Some(monitor) = overlay.current_monitor().map_err(|e| e.to_string())? {
            let size = monitor.size();
            let pos = monitor.position();
            overlay
                .set_position(pos)
                .map_err(|e| e.to_string())?;
            overlay
                .set_size(LogicalSize::new(size.width, size.height))
                .map_err(|e| e.to_string())?;
        }
        overlay.set_always_on_top(true).map_err(|e| e.to_string())?;
        overlay
            .set_ignore_cursor_events(true)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn set_overlay_clickthrough(app: tauri::AppHandle, ignore: bool) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        overlay
            .set_ignore_cursor_events(ignore)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = init_db().expect("failed to init database");
    let resource_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("characters");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            db: Mutex::new(db),
            resource_dir,
        })
        .invoke_handler(tauri::generate_handler![
            get_character_manifest,
            get_character_by_id,
            get_app_settings,
            set_app_settings,
            get_desktop_state,
            get_system_stats_cmd,
            get_cursor_position,
            setup_overlay_window,
            set_overlay_clickthrough,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = setup_overlay_window(handle).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
