mod capture;
mod character;
mod db;
mod overlay_input;
#[cfg(target_os = "linux")]
mod overlay_input_linux;
mod system;
mod tray;
mod window;

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use capture::ClipboardMonitor;
use character::{
    bundled_characters_dir, get_character, load_manifest, CharacterDefinition, CharacterManifest,
};
use db::{
    create_capture, create_note, create_task, init_database, list_clipboard, list_events,
    list_notes, list_tasks, load_settings, save_settings, search_clipboard, search_memory,
    toggle_task, AppSettings, Capture, ClipboardEntry, Task, TimelineEvent,
};
use overlay_input::{
    spawn_overlay_input_loop, update_overlay_hit_region, HitCircle, OverlayHitRegion,
    OverlayInputState,
};
use serde_json::json;
use system::{get_system_stats, SystemStats};
use tauri::{Emitter, Manager, State};
use window::{
    get_active_window, get_default_anchor, get_visible_windows, CursorPosition, DesktopState,
    MonitorInfo, WindowInfo,
};

struct AppState {
    db: Arc<Mutex<rusqlite::Connection>>,
    resource_dir: PathBuf,
    overlay_input: Arc<Mutex<OverlayInputState>>,
}

fn with_db<T, F: FnOnce(&rusqlite::Connection) -> Result<T, String>>(
    state: &State<'_, AppState>,
    f: F,
) -> Result<T, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    f(&conn)
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
    with_db(&state, |conn| load_settings(conn).map_err(|e| e.to_string()))
}

#[tauri::command]
fn set_app_settings(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<(), String> {
    with_db(&state, |conn| save_settings(conn, &settings).map_err(|e| e.to_string()))?;
    if let Some(overlay) = app.get_webview_window("overlay") {
        overlay
            .emit("settings-updated", &settings)
            .map_err(|e| e.to_string())?;
    }
    if let Some(settings_win) = app.get_webview_window("settings") {
        let _ = settings_win.emit("settings-updated", &settings);
    }
    Ok(())
}

#[tauri::command]
fn get_desktop_state(monitors: Vec<MonitorInfo>) -> DesktopState {
    let windows = get_visible_windows();
    let active = get_active_window();
    let anchor = get_default_anchor(&monitors);
    DesktopState {
        windows,
        monitors: monitors.clone(),
        cursor: CursorPosition {
            x: anchor.as_ref().map(|a| a.position.0).unwrap_or(0),
            y: anchor.as_ref().map(|a| a.position.1).unwrap_or(0),
            monitor_id: anchor.as_ref().map(|a| a.monitor_id).unwrap_or(0),
        },
        active_window_id: active.map(|w| w.id),
    }
}

#[tauri::command]
fn get_active_window_cmd() -> Option<WindowInfo> {
    get_active_window()
}

#[tauri::command]
fn get_system_stats_cmd() -> SystemStats {
    get_system_stats()
}

#[tauri::command]
fn get_cursor_position() -> (i32, i32) {
    use device_query::{DeviceQuery, DeviceState};
    let device_state = DeviceState::new();
    let mouse = device_state.get_mouse();
    mouse.coords
}

#[tauri::command]
fn get_character_model_path(state: State<'_, AppState>, character_id: String) -> Option<String> {
    let path = bundled_characters_dir(&state.resource_dir)
        .join(&character_id)
        .join("model.vrm");
    path.exists()
        .then(|| path.to_string_lossy().into_owned())
}

#[tauri::command]
fn list_clipboard_cmd(state: State<'_, AppState>, limit: Option<usize>) -> Result<Vec<ClipboardEntry>, String> {
    with_db(&state, |conn| {
        list_clipboard(conn, limit.unwrap_or(50)).map_err(|e| e.to_string())
    })
}

#[tauri::command]
fn search_clipboard_cmd(
    state: State<'_, AppState>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<ClipboardEntry>, String> {
    with_db(&state, |conn| {
        search_clipboard(conn, &query, limit.unwrap_or(30)).map_err(|e| e.to_string())
    })
}

#[tauri::command]
fn list_timeline_cmd(state: State<'_, AppState>, limit: Option<usize>) -> Result<Vec<TimelineEvent>, String> {
    with_db(&state, |conn| list_events(conn, limit.unwrap_or(50)).map_err(|e| e.to_string()))
}

#[tauri::command]
fn search_memory_cmd(
    state: State<'_, AppState>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<TimelineEvent>, String> {
    with_db(&state, |conn| {
        search_memory(conn, &query, limit.unwrap_or(30)).map_err(|e| e.to_string())
    })
}

#[tauri::command]
fn list_notes_cmd(state: State<'_, AppState>, limit: Option<usize>) -> Result<Vec<Capture>, String> {
    with_db(&state, |conn| list_notes(conn, limit.unwrap_or(50)).map_err(|e| e.to_string()))
}

#[tauri::command]
fn list_tasks_cmd(state: State<'_, AppState>, limit: Option<usize>) -> Result<Vec<Task>, String> {
    with_db(&state, |conn| list_tasks(conn, limit.unwrap_or(50)).map_err(|e| e.to_string()))
}

#[tauri::command]
fn create_note_cmd(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    title: Option<String>,
    content: String,
) -> Result<Capture, String> {
    let active = get_active_window();
    let source = active.as_ref().map(|w| w.app_name.as_str());
    let capture = with_db(&state, |conn| {
        create_note(conn, title.as_deref(), &content, source).map_err(|e| e.to_string())
    })?;
    let _ = app.emit("aura-event", json!({ "type": "note_created", "title": capture.title }));
    Ok(capture)
}

#[tauri::command]
fn create_task_cmd(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    title: String,
) -> Result<Task, String> {
    let task = with_db(&state, |conn| create_task(conn, &title).map_err(|e| e.to_string()))?;
    let _ = app.emit("aura-event", json!({ "type": "task_created", "title": task.title }));
    Ok(task)
}

#[tauri::command]
fn toggle_task_cmd(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    with_db(&state, |conn| toggle_task(conn, &id).map_err(|e| e.to_string()))
}

#[tauri::command]
fn create_capture_cmd(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    capture_type: String,
    title: Option<String>,
    content: String,
) -> Result<Capture, String> {
    let active = get_active_window();
    let source = active.as_ref().map(|w| w.app_name.as_str());
    let title_ref = active.as_ref().map(|w| w.title.as_str());
    let capture = with_db(&state, |conn| {
        create_capture(
            conn,
            &capture_type,
            title.as_deref(),
            &content,
            source,
            title_ref,
            None,
        )
        .map_err(|e| e.to_string())
    })?;
    let _ = app.emit(
        "aura-event",
        json!({ "type": "capture_saved", "capture_type": capture_type }),
    );
    Ok(capture)
}

#[tauri::command]
fn feed_treat(app: tauri::AppHandle) -> Result<(), String> {
    app.emit("companion-action", json!({ "action": "feed_treat" }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn show_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    tray::show_settings_window(app)
}

#[tauri::command]
fn toggle_companion_visibility(app: tauri::AppHandle) -> Result<(), String> {
    tray::toggle_companion_visibility(app)
}

#[tauri::command]
fn ensure_overlay_on_top_cmd(app: tauri::AppHandle) -> Result<(), String> {
    tray::ensure_overlay_on_top(app)
}

#[tauri::command]
async fn setup_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::LogicalSize;

    if let Some(overlay) = app.get_webview_window("overlay") {
        if let Some(monitor) = overlay.current_monitor().map_err(|e| e.to_string())? {
            let size = monitor.size();
            let pos = monitor.position();
            overlay.set_position(*pos).map_err(|e| e.to_string())?;
            overlay
                .set_size(LogicalSize::new(size.width, size.height))
                .map_err(|e| e.to_string())?;
        }
        tray::ensure_overlay_on_top(app.clone())?;
        #[cfg(target_os = "linux")]
        overlay_input_linux::init_overlay_pass_through(&app);
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

#[tauri::command]
fn overlay_uses_dom_input() -> bool {
    overlay_input::overlay_uses_dom_input()
}

#[tauri::command]
fn set_overlay_hit_region(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    circles: Vec<HitCircle>,
    force_interactive: bool,
) -> Result<(), String> {
    update_overlay_hit_region(
        &app,
        &state.overlay_input,
        OverlayHitRegion {
            circles,
            force_interactive,
        },
    );
    Ok(())
}

#[tauri::command]
fn emit_companion_action(app: tauri::AppHandle, action: String) -> Result<(), String> {
    app.emit("companion-action", json!({ "action": action }))
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = init_database().expect("failed to init database");
    let db = Arc::new(Mutex::new(db));
    let resource_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .to_path_buf();

    let clipboard_monitor = Arc::new(ClipboardMonitor::new());
    let overlay_input = Arc::new(Mutex::new(OverlayInputState::default()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(AppState {
            db: Arc::clone(&db),
            resource_dir,
            overlay_input: Arc::clone(&overlay_input),
        })
        .invoke_handler(tauri::generate_handler![
            get_character_manifest,
            get_character_by_id,
            get_app_settings,
            set_app_settings,
            get_desktop_state,
            get_active_window_cmd,
            get_system_stats_cmd,
            get_cursor_position,
            get_character_model_path,
            list_clipboard_cmd,
            search_clipboard_cmd,
            list_timeline_cmd,
            search_memory_cmd,
            list_notes_cmd,
            list_tasks_cmd,
            create_note_cmd,
            create_task_cmd,
            toggle_task_cmd,
            create_capture_cmd,
            feed_treat,
            show_settings_window,
            toggle_companion_visibility,
            ensure_overlay_on_top_cmd,
            setup_overlay_window,
            set_overlay_clickthrough,
            set_overlay_hit_region,
            overlay_uses_dom_input,
            emit_companion_action,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();
            spawn_overlay_input_loop(handle.clone(), Arc::clone(&overlay_input));
            #[cfg(target_os = "linux")]
            overlay_input_linux::init_overlay_pass_through(&handle);

            clipboard_monitor.spawn(handle.clone(), Arc::clone(&db));

            tray::setup_tray(&handle).expect("failed to create system tray");
            tray::hide_settings_on_start(&handle).expect("failed to hide settings window");
            tray::attach_overlay_keep_on_top(&handle);
            tray::spawn_overlay_keep_on_top_loop(&handle);

            use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

            let capture_shortcut =
                Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyA);
            let palette_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyK);

            let h1 = handle.clone();
            app.global_shortcut().on_shortcut(capture_shortcut, move |_app, _shortcut, _event| {
                let _ = h1.emit("global-shortcut", json!({ "action": "capture" }));
            })?;

            let h2 = handle.clone();
            app.global_shortcut().on_shortcut(palette_shortcut, move |_app, _shortcut, _event| {
                let _ = h2.emit("global-shortcut", json!({ "action": "palette" }));
            })?;

            let setup_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                let _ = setup_overlay_window(setup_handle).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
