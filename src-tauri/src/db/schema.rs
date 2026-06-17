use rusqlite::Connection;
use rusqlite::Result as SqlResult;

pub fn migrate(conn: &Connection) -> SqlResult<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS character_state (
            character_id TEXT PRIMARY KEY,
            position_x REAL,
            position_y REAL,
            last_activity TEXT
        );

        CREATE TABLE IF NOT EXISTS captures (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT,
            content TEXT,
            source_app TEXT,
            source_title TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            project_id TEXT,
            is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS clipboard_entries (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            source_app TEXT,
            copied_at TEXT NOT NULL,
            is_sensitive INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_clipboard_hash ON clipboard_entries(content_hash);
        CREATE INDEX IF NOT EXISTS idx_clipboard_copied ON clipboard_entries(copied_at);

        CREATE TABLE IF NOT EXISTS timeline_events (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT,
            content_ref TEXT NOT NULL,
            content_table TEXT NOT NULL,
            source_app TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_timeline_timestamp ON timeline_events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_timeline_type ON timeline_events(event_type);

        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            done INTEGER DEFAULT 0,
            due_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            color TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            is_archived INTEGER DEFAULT 0
        );
        ",
    )?;
    Ok(())
}
