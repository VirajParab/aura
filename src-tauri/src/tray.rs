use serde_json::json;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Wry,
};

const TRAY_ID: &str = "aura-tray";

pub struct TrayState {
    toggle_item: MenuItem<Wry>,
}

pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let settings = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
    let toggle = MenuItem::with_id(app, "toggle_companion", "Hide Companion", true, None::<&str>)?;
    let treat = MenuItem::with_id(app, "feed_treat", "Feed Treat", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit AuraOS", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&settings, &toggle, &treat, &separator, &quit])?;

    let icon = app
        .default_window_icon()
        .cloned()
        .unwrap_or_else(|| tauri::include_image!("icons/32x32.png"));

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .tooltip("AuraOS Companion")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "settings" => {
                let _ = show_settings_window(app.clone());
            }
            "toggle_companion" => {
                let _ = toggle_companion_visibility(app.clone());
            }
            "feed_treat" => {
                let _ = app.emit("companion-action", json!({ "action": "feed_treat" }));
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                let _ = show_settings_window(app.clone());
            }
        })
        .build(app)?;

    app.manage(TrayState {
        toggle_item: toggle,
    });

    Ok(())
}

pub fn show_settings_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.unminimize().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn toggle_companion_visibility(app: AppHandle) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let visible = overlay.is_visible().map_err(|e| e.to_string())?;
        if visible {
            overlay.hide().map_err(|e| e.to_string())?;
        } else {
            overlay.show().map_err(|e| e.to_string())?;
            ensure_overlay_on_top(app.clone())?;
        }
    }
    update_toggle_menu_label(&app);
    Ok(())
}

pub fn ensure_overlay_on_top(app: AppHandle) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        overlay
            .set_always_on_top(true)
            .map_err(|e| e.to_string())?;
        overlay
            .set_ignore_cursor_events(true)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn update_toggle_menu_label(app: &AppHandle) {
    let Some(state) = app.try_state::<TrayState>() else {
        return;
    };
    let visible = app
        .get_webview_window("overlay")
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(true);

    let _ = state.toggle_item.set_text(if visible {
        "Hide Companion"
    } else {
        "Show Companion"
    });
}

pub fn hide_settings_on_start(app: &AppHandle) -> Result<(), String> {
    if let Some(settings) = app.get_webview_window("settings") {
        settings.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn attach_overlay_keep_on_top(app: &AppHandle) {
    let Some(overlay) = app.get_webview_window("overlay") else {
        return;
    };

    let app_handle = app.clone();
    overlay.on_window_event(move |event| {
        if matches!(event, tauri::WindowEvent::Focused(false)) {
            let _ = ensure_overlay_on_top(app_handle.clone());
        }
    });
}

pub fn spawn_overlay_keep_on_top_loop(app: &AppHandle) {
    let handle = app.clone();
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_secs(2));
            let h = handle.clone();
            let _ = handle.run_on_main_thread(move || {
                let _ = ensure_overlay_on_top(h);
            });
        }
    });
}
