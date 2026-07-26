use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{debug, info, warn};

use crate::{errors::AppError, AppState};

#[derive(Deserialize)]
pub struct WritePostRequest {
    pub title: String,
    pub slug: Option<String>,
    pub description: String,
    pub content_md: String,
    pub tags: Vec<String>,
    pub published: bool,
}

// Struct specifically for updating the post
#[derive(Deserialize)]
pub struct UpdatePostRequest {
    pub title: Option<String>,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub content_md: Option<String>,
    pub tags: Option<Vec<String>>,
    pub published: Option<bool>,
}

#[derive(Deserialize)]
pub struct AdminPostListParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub tag: Option<String>,
    pub status: Option<String>,
}

#[derive(Serialize)]
pub struct PostListResponse {
    pub posts: Vec<serde_json::Value>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

pub async fn create_post(
    State(state): State<AppState>,
    Json(payload): Json<WritePostRequest>,
) -> Result<Json<Value>, AppError> {
    debug!(
        "Starting post creation process for title: '{}'",
        payload.title
    );

    // 0. Generate a secure, unique ID for the new post
    let new_id = uuid::Uuid::new_v4().to_string();

    // 1. Slug generation logic
    let final_slug = match payload.slug {
        Some(provided_slug) if !provided_slug.trim().is_empty() => provided_slug,
        _ => slug::slugify(&payload.title),
    };

    // 2. Compile the Markdown to HTML using your custom service
    debug!("Compiling Markdown to HTML...");
    let content_html = crate::services::markdown::render_markdown(&payload.content_md);

    // 3. Convert the tags array into a JSON string for SQLite storage
    let tags_json = serde_json::to_string(&payload.tags)
        .map_err(|_| AppError::Internal("Failed to serialize tags".into()))?;

    // 4. Estimate reading time (roughly 200 words per minute)
    let word_count = payload.content_md.split_whitespace().count();
    let reading_time_mins = (word_count as f64 / 200.0).ceil() as u32;

    debug!("Delegating database insertion to model layer...");

    // 5. Delegate to the Database Model!
    let inserted_id = crate::models::post::create_post(
        &state.db,
        new_id,
        payload.title.clone(),
        final_slug.clone(),
        payload.description,
        payload.content_md,
        content_html,
        tags_json,
        payload.published,
        reading_time_mins,
    )
    .await?;

    info!(
        "Successfully created new post: {} (ID: {})",
        payload.title, inserted_id
    );

    Ok(Json(json!({
        "message": "Post created successfully!",
        "post_id": inserted_id
    })))
}

// Using the patter of fetch, merge, save
// 1-> Fetch the existing post from the database
// 2-> Replace only the fields the user provided
// 3-> Save the whole thing back in the database
pub async fn update_post(
    State(state): State<AppState>,
    Path(post_slug): Path<String>,
    Json(payload): Json<UpdatePostRequest>,
) -> Result<Json<Value>, AppError> {
    debug!("Processing update request for post slug: {}", post_slug);

    // 1. Fetch the existing post (Make it `mut` so we can modify it!)
    let mut post = crate::models::post::get_post_by_slug(&state.db, &post_slug).await?;

    // 2. Overwrite only the fields the user provided
    if let Some(title) = payload.title {
        post.title = title;
    }
    if let Some(desc) = payload.description {
        post.description = desc;
    }
    if let Some(content) = payload.content_md {
        post.content_md = content;
    }
    if let Some(published) = payload.published {
        post.published = published;
    }

    if let Some(tags_vec) = payload.tags {
        post.tags = sqlx::types::Json(tags_vec);
    }

    // 3. Auto-generate the slug based on the (potentially new) title
    post.slug = match payload.slug {
        Some(provided_slug) if !provided_slug.trim().is_empty() => provided_slug,
        _ => slug::slugify(&post.title),
    };

    // 4. Re-calculate Markdown and Reading Time using the newly mutated content
    debug!("Recompiling Markdown to HTML for post slug: {}", post_slug);
    post.content_html = crate::services::markdown::render_markdown(&post.content_md);

    let word_count = post.content_md.split_whitespace().count();
    post.reading_time_mins = (word_count as f64 / 200.0).ceil() as i64;

    debug!("Delegating database update to model layer...");

    // 5. Pass the whole mutated struct to your existing model function!
    crate::models::post::update_post(&state.db, &post).await?;

    info!("Successfully updated post slug: {}", post_slug);

    Ok(Json(json!({ "message": "Post updated successfully!" })))
}

pub async fn delete_post(
    State(state): State<AppState>,
    Path(post_slug): Path<String>,
) -> Result<Json<Value>, AppError> {
    // 1. Execute the DELETE query
    let result = sqlx::query!("DELETE FROM posts WHERE slug = ?", post_slug)
        .execute(&state.db)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    // 2. Check if the post actually existed
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Post not found".into()));
    }

    Ok(Json(json!({ "message": "Post deleted successfully!" })))
}

pub async fn list_admin_posts(
    State(state): State<AppState>,
    Query(params): Query<AdminPostListParams>,
) -> Result<Json<PostListResponse>, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(10).min(50);
    let offset = (page - 1) * per_page;

    debug!("Admin listing posts: page={}, per_page={}", page, per_page);

    // Build the query based on filters
    let (posts, total) = match (&params.tag, &params.status) {
        // Filter by tag and status
        (Some(tag), Some(status)) if status != "all" => {
            let published = status == "published";
            let rows = sqlx::query_as::<_, crate::models::post::Post>(
                "SELECT * FROM posts
                 WHERE published = ?
                 AND EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?",
            )
            .bind(published)
            .bind(tag)
            .bind(per_page)
            .bind(offset)
            .fetch_all(&state.db)
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

            let total: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM posts
                 WHERE published = ?
                 AND EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)",
            )
            .bind(published)
            .bind(tag)
            .fetch_one(&state.db)
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

            (rows, total.0)
        }
        // Filter by tag only (all statuses)
        (Some(tag), _) => {
            let rows = sqlx::query_as::<_, crate::models::post::Post>(
                "SELECT * FROM posts
                 WHERE EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?",
            )
            .bind(tag)
            .bind(per_page)
            .bind(offset)
            .fetch_all(&state.db)
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

            let total: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM posts
                 WHERE EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)",
            )
            .bind(tag)
            .fetch_one(&state.db)
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

            (rows, total.0)
        }
        // Filter by status only (no tag filter)
        (None, Some(status)) if status != "all" => {
            let published = status == "published";
            let rows = sqlx::query_as::<_, crate::models::post::Post>(
                "SELECT * FROM posts
                 WHERE published = ?
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?",
            )
            .bind(published)
            .bind(per_page)
            .bind(offset)
            .fetch_all(&state.db)
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

            let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM posts WHERE published = ?")
                .bind(published)
                .fetch_one(&state.db)
                .await
                .map_err(|e| AppError::Internal(e.to_string()))?;

            (rows, total.0)
        }
        // No filters — return everything
        _ => {
            let rows = sqlx::query_as::<_, crate::models::post::Post>(
                "SELECT * FROM posts
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?",
            )
            .bind(per_page)
            .bind(offset)
            .fetch_all(&state.db)
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

            let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM posts")
                .fetch_one(&state.db)
                .await
                .map_err(|e| AppError::Internal(e.to_string()))?;

            (rows, total.0)
        }
    };

    // Convert posts to JSON values — include all fields
    let posts_json: Vec<serde_json::Value> = posts
        .into_iter()
        .map(|p| {
            json!({
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "description": p.description,
                "tags": p.tags.0,
                "published": p.published,
                "reading_time_mins": p.reading_time_mins,
                "created_at": p.created_at,
                "updated_at": p.updated_at
            })
        })
        .collect();

    Ok(Json(PostListResponse {
        posts: posts_json,
        total,
        page,
        per_page,
    }))
}

pub async fn get_admin_post(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<Value>, AppError> {
    debug!("Admin fetching post by slug: {}", slug);

    let post = sqlx::query_as::<_, crate::models::post::Post>("SELECT * FROM posts WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("Post not found".into()))?;

    // Include content_md — the editor needs it
    Ok(Json(json!({
        "id": post.id,
        "title": post.title,
        "slug": post.slug,
        "description": post.description,
        "tags": post.tags.0,
        "content_md": post.content_md,
        "content_html": post.content_html,
        "published": post.published,
        "reading_time_mins": post.reading_time_mins,
        "created_at": post.created_at,
        "updated_at": post.updated_at
    })))
}
