mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;
mod services;

use crate::services::rate_limiter::RateLimiter;
use axum::http::{header, Method};
use sqlx::SqlitePool;
use std::net::SocketAddr;
use std::str::FromStr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

use crate::config::Config;
use aws_sdk_s3::Client as S3Client;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub config: Arc<Config>,
    pub s3_client: S3Client,
    pub rate_limiter: Arc<RateLimiter>,
}

use tower_http::trace::TraceLayer;
use tracing::{debug, info};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    // 1. Initialize Structured Logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "blog_backend=debug,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Loading configuration...");

    let app_config = Config::from_env();

    info!("Configuration loaded successfully!");
    debug!("Database URL: {}", app_config.database_url);
    info!(
        "Server configured for: {}:{}",
        app_config.server_host, app_config.server_port
    );
    info!("Admin Email: {}", app_config.admin_email);

    // 2. Database connection
    let db_pool = db::establish_connection(&app_config).await;

    // 3. S3 client
    info!("Initializing S3 client...");
    let aws_config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(aws_sdk_s3::config::Region::new(
            app_config.aws_s3_region.clone(),
        ))
        .load()
        .await;

    let s3_client = S3Client::new(&aws_config);
    info!(
        "S3 client initialized for bucket: {}",
        app_config.aws_s3_bucket
    );

    let rate_limiter = Arc::new(RateLimiter::new(5, 60));

    let server_host = app_config.server_host.clone();
    let server_port = app_config.server_port;

    // 4. Build shared state
    let state = AppState {
        db: db_pool,
        config: Arc::new(app_config),
        s3_client,
        rate_limiter,
    };

    // 5. CORS
    let frontend_url = "http://localhost:3000".parse().unwrap();

    let cors = CorsLayer::new()
        .allow_origin([frontend_url])
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::ACCEPT])
        .allow_credentials(true);

    // 6. Build router with middleware
    let app = crate::handlers::create_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // 7. Start server
    let host = std::net::IpAddr::from_str(&server_host)
        .unwrap_or(std::net::IpAddr::V4(std::net::Ipv4Addr::new(127, 0, 0, 1)));
    let addr = SocketAddr::new(host, server_port);
    info!("🚀 Server successfully started on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .unwrap();
}
