use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInfo {
    pub id: u32,
    pub title: String,
    pub app_name: String,
    pub rect: Rect,
    pub z_order: i32,
    pub is_minimized: bool,
    pub monitor_id: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AnchorSurface {
    WindowTop,
    WindowBottom,
    WindowCorner,
    TitleBar,
    Taskbar,
    MenuBar,
    Desktop,
    ScreenEdge,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Anchor {
    pub surface: AnchorSurface,
    pub window_id: Option<u32>,
    pub position: (i32, i32),
    pub monitor_id: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub id: u32,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
    pub is_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CursorPosition {
    pub x: i32,
    pub y: i32,
    pub monitor_id: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesktopState {
    pub windows: Vec<WindowInfo>,
    pub monitors: Vec<MonitorInfo>,
    pub cursor: CursorPosition,
    pub active_window_id: Option<u32>,
}

/// Returns visible windows. Platform-specific implementation; stub on unsupported.
pub fn get_visible_windows() -> Vec<WindowInfo> {
    #[cfg(target_os = "linux")]
    {
        return linux_get_windows();
    }
    #[cfg(not(target_os = "linux"))]
    {
        vec![]
    }
}

#[cfg(target_os = "linux")]
fn linux_get_windows() -> Vec<WindowInfo> {
    // Basic stub: returns empty until X11/Wayland integration is added.
    // Frontend uses monitor bounds for desktop anchoring in Phase 1.
    vec![]
}

pub fn get_default_anchor(monitors: &[MonitorInfo]) -> Option<Anchor> {
    let primary = monitors.iter().find(|m| m.is_primary).or(monitors.first())?;
    Some(Anchor {
        surface: AnchorSurface::ScreenEdge,
        window_id: None,
        position: (
            primary.x + (primary.width as i32 / 2),
            primary.y + primary.height as i32 - 80,
        ),
        monitor_id: primary.id,
    })
}
