use serde::Serialize;
use string_tools;
use tokio::io::AsyncWriteExt;

#[derive(Clone, Debug, Serialize)]
struct Sheet {
    title: String,
    description: Option<String>,
    path: String,
    url: String,
}

#[derive(Clone, Debug, Serialize)]
struct Category {
    title: String,
    sheets: Vec<Sheet>,
}

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
                        let path = url.split("/").last().unwrap();
                        let sheet = Sheet {
                            title: title.to_string(),
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

use std::{fs, io::Write};

#[tokio::main]
async fn main() {
    println!("cargo:info=Starting build process...");
    let mut log_file = std::fs::File::create("../dist/public/build.log").unwrap();
    let sheets = extract_readme_content();
    // Write the content to a file
    let mut content = serde_json::to_string(&sheets).unwrap();
    content.push('\n');
    std::fs::write("../dist/public/sheets.json", content).unwrap();
    println!("cargo:info=Saved sheets.json");
    fs::create_dir_all("dist/public/sheets").unwrap();
    let fetches: Vec<_> = sheets.iter()
        .flat_map(|cat| cat.sheets.iter())
        .map(|sheet| {
            writeln!(log_file, "cargo:info=Downloading {}", sheet.path);
            let mut log_file = log_file.try_clone().unwrap();
            async move {
                match download_pdf(sheet.url.clone(), format!("dist/public/sheets/{}", sheet.path)).await {
                    Ok(_) => writeln!(log_file ,"nfo=Downloaded {}", sheet.title),
                    Err(e) => writeln!(log_file, "error={}", e),
                }
            }
        })
    .collect();
    
    // Wait for all downloads to complete
    let _results = futures::future::join_all(fetches).await;
    tauri_build::build();
}
