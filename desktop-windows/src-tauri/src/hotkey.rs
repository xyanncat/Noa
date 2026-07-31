use tauri::{AppHandle, Manager, Runtime};

pub fn show_overlay<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Noa overlay window was not created.".to_string())?;
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

pub fn hide_overlay<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Noa overlay window was not created.".to_string())?;
    window.hide().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn toggle_overlay(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Noa overlay window was not created.".to_string())?;
    if window.is_visible().map_err(|error| error.to_string())? {
        hide_overlay(&app)
    } else {
        show_overlay(&app)
    }
}
