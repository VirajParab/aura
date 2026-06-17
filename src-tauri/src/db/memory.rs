use chrono::Utc;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capture {
    pub id: String,
    pub capture_type: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub source_app: Option<String>,
    pub source_title: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub due_at: Option<String>,
    pub created_at: String,
}

pub fn create_note(
    conn: &Connection,
    title: Option<&str>,
    content: &str,
    source_app: Option<&str>,
) -> SqlResult<Capture> {
    create_capture(conn, "note", title, content, source_app, None, None)
}

pub fn create_capture(
    conn: &Connection,
    capture_type: &str,
    title: Option<&str>,
    content: &str,
    source_app: Option<&str>,
    source_title: Option<&str>,
    metadata: Option<&str>,
) -> SqlResult<Capture> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();
    let display_title = title.unwrap_or("Untitled");

    conn.execute(
        "INSERT INTO captures (id, type, title, content, source_app, source_title, metadata, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            id,
            capture_type,
            display_title,
            content,
            source_app,
            source_title,
            metadata,
            now,
            now,
        ],
    )?;

    let event_type = match capture_type {
        "trade" => "trade",
        "task" => "task",
        _ => "note",
    };

    super::timeline::insert_event(
        conn,
        event_type,
        display_title,
        Some(&content.chars().take(120).collect::<String>()),
        &id,
        "captures",
        source_app,
        metadata,
    )?;

    Ok(Capture {
        id,
        capture_type: capture_type.to_string(),
        title: Some(display_title.to_string()),
        content: Some(content.to_string()),
        source_app: source_app.map(str::to_string),
        source_title: source_title.map(str::to_string),
        metadata: metadata.map(str::to_string),
        created_at: now,
    })
}

pub fn list_notes(conn: &Connection, limit: usize) -> SqlResult<Vec<Capture>> {
    list_captures_by_type(conn, "note", limit)
}

pub fn list_captures_by_type(
    conn: &Connection,
    capture_type: &str,
    limit: usize,
) -> SqlResult<Vec<Capture>> {
    let mut stmt = conn.prepare(
        "SELECT id, type, title, content, source_app, source_title, metadata, created_at
         FROM captures WHERE type = ?1 AND is_deleted = 0
         ORDER BY created_at DESC LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![capture_type, limit as i64], |row| {
        Ok(Capture {
            id: row.get(0)?,
            capture_type: row.get(1)?,
            title: row.get(2)?,
            content: row.get(3)?,
            source_app: row.get(4)?,
            source_title: row.get(5)?,
            metadata: row.get(6)?,
            created_at: row.get(7)?,
        })
    })?;
    rows.collect()
}

pub fn create_task(conn: &Connection, title: &str) -> SqlResult<Task> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO tasks (id, title, done, created_at, updated_at) VALUES (?1, ?2, 0, ?3, ?4)",
        params![id, title, now, now],
    )?;
    super::timeline::insert_event(
        conn,
        "task",
        title,
        None,
        &id,
        "tasks",
        None,
        None,
    )?;
    Ok(Task {
        id,
        title: title.to_string(),
        done: false,
        due_at: None,
        created_at: now,
    })
}

pub fn list_tasks(conn: &Connection, limit: usize) -> SqlResult<Vec<Task>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, done, due_at, created_at FROM tasks ORDER BY created_at DESC LIMIT ?1",
    )?;
    let rows = stmt.query_map([limit as i64], |row| {
        Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            done: row.get::<_, i32>(2)? != 0,
            due_at: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;
    rows.collect()
}

pub fn toggle_task(conn: &Connection, id: &str) -> SqlResult<bool> {
    let done: i32 = conn.query_row("SELECT done FROM tasks WHERE id = ?1", [id], |r| r.get(0))?;
    let next = if done == 0 { 1 } else { 0 };
    conn.execute(
        "UPDATE tasks SET done = ?1, updated_at = ?2 WHERE id = ?3",
        params![next, Utc::now().to_rfc3339(), id],
    )?;
    Ok(next != 0)
}

pub fn search_memory(conn: &Connection, query: &str, limit: usize) -> SqlResult<Vec<super::timeline::TimelineEvent>> {
    let pattern = format!("%{}%", query.trim());
    let mut stmt = conn.prepare(
        "SELECT id, event_type, timestamp, title, summary, content_ref, content_table, source_app, metadata
         FROM timeline_events
         WHERE title LIKE ?1 OR summary LIKE ?1
         ORDER BY timestamp DESC LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![pattern, limit as i64], |row| {
        Ok(super::timeline::TimelineEvent {
            id: row.get(0)?,
            event_type: row.get(1)?,
            timestamp: row.get(2)?,
            title: row.get(3)?,
            summary: row.get(4)?,
            content_ref: row.get(5)?,
            content_table: row.get(6)?,
            source_app: row.get(7)?,
            metadata: row.get(8)?,
        })
    })?;
    rows.collect()
}
