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
    use std::process::Command;

    let output = Command::new("wmctrl").args(["-lG"]).output();
    if let Ok(out) = output {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout);
            return parse_wmctrl_lines(&text);
        }
    }
    vec![]
}

#[cfg(target_os = "linux")]
fn parse_wmctrl_lines(text: &str) -> Vec<WindowInfo> {
    text.lines()
        .enumerate()
        .filter_map(|(i, line)| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 9 {
                return None;
            }
            let id = u32::from_str_radix(parts[0].trim_start_matches("0x"), 16).ok()?;
            let x: i32 = parts[2].parse().ok()?;
            let y: i32 = parts[3].parse().ok()?;
            let w: u32 = parts[4].parse().ok()?;
            let h: u32 = parts[5].parse().ok()?;
            let title = parts[8..].join(" ");
            Some(WindowInfo {
                id,
                title: title.clone(),
                app_name: title,
                rect: Rect {
                    x,
                    y,
                    width: w,
                    height: h,
                },
                z_order: i as i32,
                is_minimized: false,
                monitor_id: 0,
            })
        })
        .collect()
}

pub fn get_active_window() -> Option<WindowInfo> {
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        let id_out = Command::new("xdotool")
            .args(["getactivewindow", "getwindowname"])
            .output()
            .ok()?;
        if !id_out.status.success() {
            return None;
        }
        let stdout = String::from_utf8_lossy(&id_out.stdout);
        let lines: Vec<&str> = stdout.lines().collect();
        let title = lines.last().unwrap_or(&"Unknown").to_string();
        let windows = linux_get_windows();
        return windows.into_iter().find(|w| w.title == title).or(Some(WindowInfo {
            id: 0,
            title: title.clone(),
            app_name: title,
            rect: Rect {
                x: 0,
                y: 0,
                width: 800,
                height: 600,
            },
            z_order: 0,
            is_minimized: false,
            monitor_id: 0,
        }));
    }
    #[cfg(not(target_os = "linux"))]
    {
        None
    }
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
