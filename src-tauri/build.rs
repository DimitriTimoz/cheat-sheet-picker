
use std::fmt::format;

use tokio::io::AsyncWriteExt;
use models::*;

fn extract_readme_content() -> Vec<Category> {
    // Read the README.md file
    let readme = std::fs::read_to_string("../ds-cheatsheets/README.md").unwrap();

    let summary = string_tools::get_all_between_strict(&readme, "## Table of Contents", "----------------------------------------");
    
    if let Some(summary) = summary {
        // Read each line
        let lines = summary.lines();
        let mut categories: Vec<Category> = Vec::new();

        for line in lines {
            if line.starts_with("- [") {
                let args = line.splitn(2, "](").collect::<Vec<_>>();
                if args.len() == 2 {
                    let title = args[0].split_at(3).1;
                    
                    let category = Category {
                        title: title.to_string(),
                        sheets: Vec::new(),
                    };
                    categories.push(category);
                } else {
                    println!("Invalid line: {}", line);
                }
            } else if line.starts_with("    - [") {
                if let Some(cat) = categories.last_mut() {
                    let args = line.splitn(2, "](").collect::<Vec<_>>();
                    if args.len() == 2 {
                        let title = args[0].split_at(7).1;
                        let url = args[1].split_at(args[1].len() - 1).0;
                        let path = url.split('/').last().unwrap();
                        let sheet = Sheet {
                            title: format!("{} | {}", cat.title, title),
                            description: None,
                            path: path.to_string(),
                            url: url.to_string(),
                        };
                        cat.sheets.push(sheet);
                    } else {
                        println!("Invalid line: {}", line);
                    }
                } else {
                    println!("No category found for sheet: {}", line);
                } 
            } 
        }
        categories  
    } else {
        println!("No summary found");
        Vec::new()
    }
    
}

async fn download_pdf(url: String, path: String) -> Result<(), anyhow::Error> {
    // Transformer l'URL de GitHub pour pointer vers le fichier brut
    let raw_url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    // Vérifier si le fichier existe déjà
    if std::path::Path::new(&path).exists() {
        println!("cargo:error=File already exists");
        return Ok(());
    }

    // Effectuer la requête HTTP
    let response = reqwest::get(raw_url).await?;
    let mut file = tokio::fs::File::create(path).await?;
    let content = response.bytes().await?;
    file.write_all(&content).await?;
    Ok(())
}

#[tokio::main]
async fn main() {
    println!("cargo:info=Starting build process...");
    let sheets = extract_readme_content();
    // Write the content to a file
    let mut content = serde_json::to_string(&sheets).unwrap();
    content.push('\n');
    std::fs::write("../ui/sheets.json", content).unwrap();
    std::fs::create_dir_all("../ui/sheets").unwrap();
    let fetches: Vec<_> = sheets.iter()
        .flat_map(|cat| cat.sheets.iter())
        .map(|sheet| {
            async move {
                match download_pdf(sheet.url.clone(), format!("../ui/sheets/{}", sheet.path)).await {
                    Err(e) => panic!( "{}", e),
                    _ => println!("cargo:info=Downloaded {}", sheet.title),
                }
            }
        })
    .collect();
    
    // Wait for all downloads to complete
    let _results = futures::future::join_all(fetches).await;
    tauri_build::build();
}
