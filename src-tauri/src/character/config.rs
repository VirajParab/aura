use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CharacterError {
    #[error("character not found: {0}")]
    NotFound(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CharacterCategory {
    CuteAnimals,
    AnimeCompanions,
    CartoonCharacters,
    HighTechAi,
    FantasyMythology,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterBehaviors {
    pub ambient: Vec<String>,
    pub idle_sleep: String,
    pub celebrate: String,
    #[serde(default)]
    pub follow_cursor: bool,
    #[serde(default)]
    pub multi_monitor_chase: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterInteractions {
    pub single_click: String,
    pub double_click: String,
    pub long_press: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPhysicsConfig {
    pub preferred_anchors: Vec<String>,
    #[serde(default)]
    pub can_hang: bool,
    #[serde(default)]
    pub can_hide_behind: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterDefinition {
    pub id: String,
    pub name: String,
    pub category: CharacterCategory,
    pub emoji: String,
    pub model: String,
    pub scale: f32,
    pub color: String,
    pub personality_prompt: String,
    pub behaviors: CharacterBehaviors,
    pub interactions: CharacterInteractions,
    pub spawn_objects: Vec<String>,
    pub special_tricks: Vec<String>,
    pub window_physics: WindowPhysicsConfig,
    pub widget: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterManifest {
    pub version: String,
    pub launch_lineup: Vec<String>,
    pub characters: Vec<CharacterDefinition>,
}

pub fn bundled_characters_dir(resource_dir: &PathBuf) -> PathBuf {
    if resource_dir.ends_with("characters") {
        resource_dir.clone()
    } else {
        resource_dir.join("characters")
    }
}

pub fn load_manifest(resource_dir: &PathBuf) -> Result<CharacterManifest, CharacterError> {
    let path = bundled_characters_dir(resource_dir).join("manifest.json");
    let content = fs::read_to_string(&path)?;
    Ok(serde_json::from_str(&content)?)
}

pub fn get_character(
    resource_dir: &PathBuf,
    id: &str,
) -> Result<CharacterDefinition, CharacterError> {
    let manifest = load_manifest(resource_dir)?;
    manifest
        .characters
        .into_iter()
        .find(|c| c.id == id)
        .ok_or_else(|| CharacterError::NotFound(id.to_string()))
}
