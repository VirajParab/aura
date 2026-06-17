use tauri::{AppHandle, Manager, WebviewWindow};

use crate::overlay_input::OverlayHitRegion;

pub fn is_linux_session() -> bool {
    cfg!(target_os = "linux")
}

pub fn apply_input_shape(overlay: &WebviewWindow, region: &OverlayHitRegion) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        use cairo::{RectangleInt, Region};
        use gtk::prelude::WidgetExt;

        let gtk_window = overlay.gtk_window().map_err(|e| e.to_string())?;

        if region.force_interactive {
            gtk_window.input_shape_combine_region(None);
            return Ok(());
        }

        if region.circles.is_empty() {
            let pass_through = Region::create_rectangle(&RectangleInt::new(0, 0, 1, 1));
            gtk_window.input_shape_combine_region(Some(&pass_through));
            return Ok(());
        }

        let mut shape = Region::create();
        for circle in &region.circles {
            if circle.radius <= 0.0 {
                continue;
            }
            let r = circle.radius.round().max(1.0) as i32;
            let cx = circle.x.round() as i32;
            let cy = circle.y.round() as i32;
            let rect = RectangleInt::new(cx - r, cy - r, r * 2, r * 2);
            if shape.is_empty() {
                shape = Region::create_rectangle(&rect);
            } else {
                let _ = shape.union_rectangle(&rect);
            }
        }

        if shape.is_empty() {
            let pass_through = Region::create_rectangle(&RectangleInt::new(0, 0, 1, 1));
            gtk_window.input_shape_combine_region(Some(&pass_through));
        } else {
            gtk_window.input_shape_combine_region(Some(&shape));
        }

        Ok(())
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = (overlay, region);
        Ok(())
    }
}

pub fn apply_input_shape_for_app(app: &AppHandle, region: &OverlayHitRegion) {
    if !is_linux_session() {
        return;
    }

    let app = app.clone();
    let region = region.clone();
    let _ = app.clone().run_on_main_thread(move || {
        if let Some(overlay) = app.get_webview_window("overlay") {
            if let Err(err) = apply_input_shape(&overlay, &region) {
                eprintln!("failed to apply overlay input shape: {err}");
            }
        }
    });
}

pub fn init_overlay_pass_through(app: &AppHandle) {
    if !is_linux_session() {
        return;
    }

    let region = OverlayHitRegion::default();
    apply_input_shape_for_app(app, &region);
}
