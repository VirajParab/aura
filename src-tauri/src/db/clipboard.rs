use chrono::Utc;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardEntry {
    pub id: String,
    pub text: String,
    pub content_hash: String,
    pub source_app: Option<String>,
    pub copied_at: String,
    pub is_sensitive: bool,
}

fn hash_text(text: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn is_sensitive(text: &str) -> bool {
    let lower = text.to_lowercase();
    if lower.contains("password") || lower.contains("api_key") || lower.contains("secret=") {
        return true;
    }
    if text.len() < 8 {
        return false;
    }
  // AWS keys, bearer tokens
    if text.starts_with("AKIA") || lower.starts_with("bearer ") {
        return true;
    }
    false
}

pub fn save_clipboard(
    conn: &Connection,
    text: &str,
    source_app: Option<&str>,
) -> SqlResult<Option<ClipboardEntry>> {
    let trimmed = text.trim();
    if trimmed.is_empty() || trimmed.len() > 50_000 {
        return Ok(None);
    }
    if is_sensitive(trimmed) {
        return Ok(None);
    }

    let hash = hash_text(trimmed);
    let exists: i64 = conn.query_row(
        "SELECT COUNT(1) FROM clipboard_entries WHERE content_hash = ?1 AND is_deleted = 0",
        [hash.clone()],
        |row| row.get(0),
    )?;
    if exists > 0 {
        return Ok(None);
    }

    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();
    let preview: String = trimmed.chars().take(80).collect();

    conn.execute(
        "INSERT INTO clipboard_entries (id, text, content_hash, source_app, copied_at, is_sensitive)
         VALUES (?1, ?2, ?3, ?4, ?5, 0)",
        params![id, trimmed, hash, source_app, now],
    )?;

    super::timeline::insert_event(
        conn,
        "clipboard_copy",
        "Clipboard copy",
        Some(&preview),
        &id,
        "clipboard_entries",
        source_app,
        None,
    )?;

    Ok(Some(ClipboardEntry {
        id,
        text: trimmed.to_string(),
        content_hash: hash,
        source_app: source_app.map(str::to_string),
        copied_at: now,
        is_sensitive: false,
    }))
}

pub fn list_clipboard(conn: &Connection, limit: usize) -> SqlResult<Vec<ClipboardEntry>> {
    let mut stmt = conn.prepare(
        "SELECT id, text, content_hash, source_app, copied_at, is_sensitive
         FROM clipboard_entries WHERE is_deleted = 0
         ORDER BY copied_at DESC LIMIT ?1",
    )?;
    let rows = stmt.query_map([limit as i64], |row| {
        Ok(ClipboardEntry {
            id: row.get(0)?,
            text: row.get(1)?,
            content_hash: row.get(2)?,
            source_app: row.get(3)?,
            copied_at: row.get(4)?,
            is_sensitive: row.get::<_, i32>(5)? != 0,
        })
    })?;
    rows.collect()
}

pub fn search_clipboard(conn: &Connection, query: &str, limit: usize) -> SqlResult<Vec<ClipboardEntry>> {
    let pattern = format!("%{}%", query.trim());
    let mut stmt = conn.prepare(
        "SELECT id, text, content_hash, source_app, copied_at, is_sensitive
         FROM clipboard_entries WHERE is_deleted = 0 AND text LIKE ?1
         ORDER BY copied_at DESC LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![pattern, limit as i64], |row| {
        Ok(ClipboardEntry {
            id: row.get(0)?,
            text: row.get(1)?,
            content_hash: row.get(2)?,
            source_app: row.get(3)?,
            copied_at: row.get(4)?,
            is_sensitive: row.get::<_, i32>(5)? != 0,
        })
    })?;
    rows.collect()
}
