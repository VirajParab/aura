use std::sync::Mutex;
use std::time::Duration;

use arboard::Clipboard;
use tauri::{AppHandle, Emitter};

use crate::db::save_clipboard;

pub struct ClipboardMonitor {
    last_text: Mutex<String>,
}

impl ClipboardMonitor {
    pub fn new() -> Self {
        Self {
            last_text: Mutex::new(String::new()),
        }
    }

    pub fn spawn(self: std::sync::Arc<Self>, app: AppHandle, db: std::sync::Arc<Mutex<rusqlite::Connection>>) {
        std::thread::spawn(move || loop {
            std::thread::sleep(Duration::from_millis(900));
            if let Ok(mut clipboard) = Clipboard::new() {
                if let Ok(text) = clipboard.get_text() {
                    let mut last = self.last_text.lock().unwrap();
                    if text != *last {
                        *last = text.clone();
                        drop(last);
                        if let Ok(conn) = db.lock() {
                            if let Ok(Some(entry)) = save_clipboard(&conn, &text, Some("system")) {
                                let _ = app.emit("clipboard-updated", &entry);
                                let _ = app.emit("aura-event", serde_json::json!({
                                    "type": "clipboard_copy",
                                    "title": "Clipboard copy"
                                }));
                            }
                        }
                    }
                }
            }
        });
    }
}
