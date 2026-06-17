//! SQLite settings persistence.

mod settings;

pub use settings::{init_db, load_settings, save_settings, AppSettings};
