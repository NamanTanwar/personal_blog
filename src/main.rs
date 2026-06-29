mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;
mod services;

use axum::Router;
use sqlx::SqlitePool;
use std::net::SocketAddr;
use std::str::FromStr;
use axum::http::{Method, header};
use tower_http::cors::CorsLayer;

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub config: Config,
}

use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use tower_http::trace::TraceLayer;
use tracing::{info, debug};

#[tokio::main]
async fn main() {
    
    // 1. Initialize Structured Logging
    // If RUST_LOG isn't set in the terminal, it defaults to showing info for your app & HTTP requests
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "blog_backend=debug,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Swapped println! for info!
    info!("Loading configuration...");

    let app_config = Config::from_env();

    info!("Configuration loaded successfully!");
    // Swapped to debug! so passwords/URLs don't constantly spam production logs
    debug!("Database URL: {}", app_config.database_url); 
    info!("Server configured for: {}:{}", app_config.server_host, app_config.server_port);
    info!("Admin Email: {}", app_config.admin_email);

    let _db_pool = db::establish_connection(&app_config).await;

    let state = AppState {
        db: _db_pool,
        config: app_config.clone(),
    };

    let frontend_url = "http://localhost:3000".parse().unwrap();

    let cors = CorsLayer::new()
        .allow_origin([frontend_url])
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers([
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            header::ACCEPT,
        ])
        .allow_credentials(true);

    // 2. Attach BOTH CORS and TraceLayer
    let app = crate::handlers::create_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http()); // <-- This single line logs every HTTP request automatically!

    let host = std::net::IpAddr::from_str(&app_config.server_host)
        .unwrap_or(std::net::IpAddr::V4(std::net::Ipv4Addr::new(127, 0, 0, 1)));
    let addr = SocketAddr::new(host, app_config.server_port);

    // --- TEMPORARY TEST FOR STEP 9 ---
    info!("--- Testing JWT Service ---");
    let test_secret = "super-secret-test-key";
    
    let token = crate::services::jwt::create_token(test_secret, 1).unwrap();
    debug!("Generated Token: {}", token);
    
    let valid_claims = crate::services::jwt::validate_token(test_secret, &token).unwrap();
    debug!("Token is valid! Subject: {}, Expires at: {}", valid_claims.sub, valid_claims.exp);
    
    let bad_result = crate::services::jwt::validate_token("wrong-secret", &token);
    debug!("Bad secret test correctly rejected: {}", bad_result.is_err());
    info!("--- JWT Test Complete ---");
    // ---------------------------------

    info!("🚀 Server successfully started on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

}