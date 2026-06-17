use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DbError {
    #[error("sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppSettings {
    pub active_character_id: String,
    pub companion_enabled: bool,
    pub companion_opacity: f32,
    pub companion_scale: f32,
    pub position_x_percent: f32,
    pub position_y_percent: f32,
    pub reduce_motion: bool,
    pub follow_cursor: bool,
    pub locomotion_enabled: bool,
    pub idle_bob: bool,
    pub move_speed: f32,
    pub onboarding_completed: bool,
    pub reaction_preferences: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            active_character_id: "mochi".to_string(),
            companion_enabled: true,
            companion_opacity: 0.95,
            companion_scale: 3.0,
            position_x_percent: 50.0,
            position_y_percent: 88.0,
            reduce_motion: false,
            follow_cursor: true,
            locomotion_enabled: true,
            idle_bob: true,
            move_speed: 120.0,
            onboarding_completed: false,
            reaction_preferences: true,
        }
    }
}

pub fn db_path() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("aura")
        .join("aura.db")
}

pub fn init_db() -> Result<Connection, DbError> {
    let path = db_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(DbError::Io)?;
    }
    let conn = Connection::open(&path)?;
    Ok(conn)
}

pub fn load_settings(conn: &Connection) -> SqlResult<AppSettings> {
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = 'app'")?;
    let mut rows = stmt.query([])?;
    if let Some(row) = rows.next()? {
        let json: String = row.get(0)?;
        let settings: AppSettings = serde_json::from_str(&json).unwrap_or_default();
        Ok(settings)
    } else {
        let defaults = AppSettings::default();
        save_settings(conn, &defaults)?;
        Ok(defaults)
    }
}

pub fn save_settings(conn: &Connection, settings: &AppSettings) -> SqlResult<()> {
    let json = serde_json::to_string(settings).unwrap_or_default();
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('app', ?1)",
        [&json],
    )?;
    Ok(())
}
