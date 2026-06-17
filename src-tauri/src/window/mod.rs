//! Desktop window geometry for character anchoring.

mod geometry;

pub use geometry::{
    get_active_window, get_default_anchor, get_visible_windows, CursorPosition, DesktopState,
    MonitorInfo, WindowInfo,
};
