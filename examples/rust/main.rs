// AtheryX SDK — Rust
//
// Minimal example using reqwest + serde_json.
// Add to Cargo.toml: reqwest = { version = "0.12", features = ["json"] }, serde_json, tokio
// Base URL: https://atheryxauth.cc/api/v1.1

use serde_json::{json, Value};

const API_BASE: &str = "https://atheryxauth.cc/api/v1.1";

async fn call(client: &reqwest::Client, endpoint: &str, payload: Value) -> Result<Value, Box<dyn std::error::Error>> {
    let res = client
        .post(format!("{API_BASE}/{endpoint}"))
        .json(&payload)
        .send()
        .await?;
    let data: Value = res.json().await?;

    if data["success"] != true {
        let msg = data["message"].as_str().unwrap_or("AtheryX request failed");
        return Err(msg.into());
    }
    Ok(data)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    // 1. Open a session
    let session = call(
        &client,
        "init",
        json!({
            "owner_id": "YOUR_OWNER_ID",
            "app_name": "YOUR_APP_NAME",
            "secret": "YOUR_APP_SECRET",
        }),
    )
    .await?;
    let session_id = session["session_id"].as_str().unwrap();
    println!("Session: {session_id}");

    // 2. Login
    let user = call(
        &client,
        "login",
        json!({
            "session_id": session_id,
            "username": "demo_user",
            "password": "ChangeMe123!",
            "hwid": "my-device-id",
        }),
    )
    .await?;
    println!("Logged in as: {}", user["username"]);

    // 3. Validate license
    let lic = call(
        &client,
        "licenses",
        json!({
            "session_id": session_id,
            "license_key": "LICENSE-KEY-XXXX-XXXX",
            "hwid": "my-device-id",
        }),
    )
    .await?;
    println!("License active: {}", lic["active"]);

    Ok(())
}
