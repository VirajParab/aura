use rusqlite::Connection;
use thiserror::Error;

mod clipboard;
mod memory;
mod schema;
mod settings;
mod timeline;

pub use clipboard::{list_clipboard, save_clipboard, search_clipboard, ClipboardEntry};
pub use memory::{
    create_capture, create_note, create_task, list_notes, list_tasks, search_memory, toggle_task,
    Capture, Task,
};
pub use settings::{load_settings, save_settings, AppSettings};
pub use timeline::{list_events, TimelineEvent};

#[derive(Debug, Error)]
pub enum DbError {
    #[error("sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

pub fn init_database() -> Result<Connection, DbError> {
    let conn = settings::init_db().map_err(|e| match e {
        settings::DbError::Sqlite(err) => DbError::Sqlite(err),
        settings::DbError::Io(err) => DbError::Io(err),
    })?;
    schema::migrate(&conn)?;
    Ok(conn)
}
