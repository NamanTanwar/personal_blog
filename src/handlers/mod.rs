use axum::{
    middleware,
    routing::{get, post,put,delete},
    Router,
};
use crate::AppState;
use tracing::{info, debug};

pub mod admin_posts;
pub mod auth;
pub mod feed;
pub mod images;
pub mod posts;

// Notice the return type is just `Router` now!
pub fn create_router(state: AppState) -> Router {
    
    // 1. Create the secure sub-router
    let admin_routes = Router::new()
        .route("/posts", post(admin_posts::create_post))
        .route("/posts/:id", put(admin_posts::update_post).delete(admin_posts::delete_post))
        .route_layer(middleware::from_fn_with_state(
            state.clone(), 
            crate::middleware::auth::require_auth
        ));

    // 2. Build the main router
    Router::new()
        .route("/api/health", get(health_check))
        
        // Public routes
        .route("/api/posts", get(posts::list_posts))
        .route("/api/posts/:slug", get(posts::get_post))
        .route("/api/tags", get(posts::list_tags))
        .route("/api/feed.xml", get(posts::rss_feed))
        
        // Auth route
        .route("/api/auth/login", post(auth::login))
        
        // Admin nest
        .nest("/api/admin", admin_routes)
        
        // 3. Attach the state to the entire app, fulfilling the requirement!
        .with_state(state)
}

async fn health_check() -> impl axum::response::IntoResponse {
    debug!("Health check requested.");
    "Backend is healthy and routing traffic!"
}