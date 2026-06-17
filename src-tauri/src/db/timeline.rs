use chrono::Utc;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineEvent {
    pub id: String,
    pub event_type: String,
    pub timestamp: String,
    pub title: String,
    pub summary: Option<String>,
    pub content_ref: String,
    pub content_table: String,
    pub source_app: Option<String>,
    pub metadata: Option<String>,
}

pub fn insert_event(
    conn: &Connection,
    event_type: &str,
    title: &str,
    summary: Option<&str>,
    content_ref: &str,
    content_table: &str,
    source_app: Option<&str>,
    metadata: Option<&str>,
) -> SqlResult<TimelineEvent> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO timeline_events
         (id, event_type, timestamp, title, summary, content_ref, content_table, source_app, metadata, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            id,
            event_type,
            now,
            title,
            summary,
            content_ref,
            content_table,
            source_app,
            metadata,
            now,
        ],
    )?;

    Ok(TimelineEvent {
        id,
        event_type: event_type.to_string(),
        timestamp: now.clone(),
        title: title.to_string(),
        summary: summary.map(str::to_string),
        content_ref: content_ref.to_string(),
        content_table: content_table.to_string(),
        source_app: source_app.map(str::to_string),
        metadata: metadata.map(str::to_string),
    })
}

pub fn list_events(conn: &Connection, limit: usize) -> SqlResult<Vec<TimelineEvent>> {
    let mut stmt = conn.prepare(
        "SELECT id, event_type, timestamp, title, summary, content_ref, content_table, source_app, metadata
         FROM timeline_events ORDER BY timestamp DESC LIMIT ?1",
    )?;
    let rows = stmt.query_map([limit as i64], |row| {
        Ok(TimelineEvent {
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
