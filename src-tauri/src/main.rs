use models::*;
use tauri::Manager; // Ensure this is added if not already present

#[tauri::command]
fn load_categories(app: tauri::AppHandle) -> Vec<Category> {
    let script_path = app
        .path()
        .resolve("sheets.json", tauri::path::BaseDirectory::Resource)
        .unwrap()
        .to_string_lossy()
        .to_string();

    let content = std::fs::read_to_string(script_path).unwrap();
    serde_json::from_str(&content).unwrap()
}


fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![load_categories])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
