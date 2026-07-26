use crate::AppState;
use axum::extract::DefaultBodyLimit;
use axum::{
    middleware,
    routing::{get, post, put},
    Router,
};
use tracing::debug;

pub mod admin_posts;
pub mod auth;
pub mod feed;
pub mod images;
pub mod posts;

pub fn create_router(state: AppState) -> Router {
    let admin_routes = Router::new()
        .route(
            "/posts",
            get(admin_posts::list_admin_posts).post(admin_posts::create_post),
        )
        .route(
            "/posts/{slug}",
            get(admin_posts::get_admin_post)
                .put(admin_posts::update_post)
                .delete(admin_posts::delete_post),
        )
        .route("/images/upload", post(images::upload_image))
        .layer(DefaultBodyLimit::max(5 * 1024 * 1024))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            crate::middleware::auth::require_auth,
        ));

    Router::new()
        .route("/api/health", get(health_check))
        .route("/api/posts", get(posts::list_posts))
        .route("/api/posts/{slug}", get(posts::get_post))
        .route("/api/tags", get(posts::list_tags))
        .route("/api/feed.xml", get(posts::rss_feed))
        .route("/api/auth/login", post(auth::login))
        .nest("/api/admin", admin_routes)
        .with_state(state)
}

async fn health_check() -> impl axum::response::IntoResponse {
    debug!("Health check requested.");
    "Backend is healthy and routing traffic!"
}
