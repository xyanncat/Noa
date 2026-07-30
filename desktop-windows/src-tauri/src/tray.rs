use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    AppHandle, Manager, Runtime,
};

use crate::hotkey;

pub fn setup<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let show = MenuItemBuilder::with_id("show", "Open Noa").build(app)?;
    let hide = MenuItemBuilder::with_id("hide", "Hide overlay").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit Noa").build(app)?;
    let menu = MenuBuilder::new(app).items(&[&show, &hide, &quit]).build()?;

    let app_handle = app.clone();
    TrayIconBuilder::with_id("noa-tray")
        .tooltip("Noa is running in the background")
        .menu(&menu)
        .on_menu_event(move |_tray, event| match event.id().as_ref() {
            "show" => {
                let _ = hotkey::show_overlay(&app_handle);
            }
            "hide" => {
                let _ = hotkey::hide_overlay(&app_handle);
            }
            "quit" => app_handle.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}
