use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;
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

pub async fn create_post(
    State(state): State<AppState>,
    Json(payload): Json<WritePostRequest>,
) -> Result<Json<Value>, AppError> {
    
    debug!("Starting post creation process for title: '{}'", payload.title);

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
        reading_time_mins
    ).await?;

    info!("Successfully created new post: {} (ID: {})", payload.title, inserted_id);

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
    Path(id): Path<String>,
    Json(payload): Json<UpdatePostRequest>, 
) -> Result<Json<Value>, AppError> {
    
    debug!("Processing update request for post ID: {}", id);

    // 1. Fetch the existing post (Make it `mut` so we can modify it!)
    let mut post = crate::models::post::get_post_by_id(&state.db, &id).await?;

    // 2. Overwrite only the fields the user provided
    if let Some(title) = payload.title { post.title = title; }
    if let Some(desc) = payload.description { post.description = desc; }
    if let Some(content) = payload.content_md { post.content_md = content; }
    if let Some(published) = payload.published { post.published = published; }

   if let Some(tags_vec) = payload.tags {
        // Let sqlx handle the serialization automatically!
        post.tags = sqlx::types::Json(tags_vec); 
    }

    // 3. Auto-generate the slug based on the (potentially new) title
    post.slug = match payload.slug {
        Some(provided_slug) if !provided_slug.trim().is_empty() => provided_slug,
        _ => slug::slugify(&post.title)
    };

    // 4. Re-calculate Markdown and Reading Time using the newly mutated content
    debug!("Recompiling Markdown to HTML for post ID: {}", id);
    post.content_html = crate::services::markdown::render_markdown(&post.content_md);
    
    let word_count = post.content_md.split_whitespace().count();
    post.reading_time_mins = (word_count as f64 / 200.0).ceil() as i64;
    // (Optional: If you are strictly mapping `updated_at` in Rust rather than SQL, 
    // update `post.updated_at` here to the current timestamp!)

    debug!("Delegating database update to model layer...");

    // 5. Pass the whole mutated struct to your existing model function!
    crate::models::post::update_post(&state.db, &post).await?;

    info!("Successfully updated post ID: {}", id);

    Ok(Json(json!({ "message": "Post updated successfully!" })))
}

pub async fn delete_post(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    
    // 1. Execute the DELETE query
    let result = sqlx::query!("DELETE FROM posts WHERE id = ?", id)
        .execute(&state.db)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    // 2. Check if the post actually existed
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Post not found".into()));
    }

    Ok(Json(json!({ "message": "Post deleted successfully!" })))
}