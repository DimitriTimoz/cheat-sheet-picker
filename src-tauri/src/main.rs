use models::*;

#[tauri::command]
fn load_categories() -> Vec<Category> {
    let content = std::fs::read_to_string("../ui/sheets.json").unwrap();
    serde_json::from_str(&content).unwrap()
}


fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![load_categories])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
