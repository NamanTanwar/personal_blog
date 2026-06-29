use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::{errors::AppError, AppState};

use axum::http::header;
use axum::response::{IntoResponse, Response};
use tracing::{debug, info, warn};

#[derive(Deserialize)]
pub struct ListQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub tag: Option<String>,
}

pub async fn list_posts(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> Result<Json<Value>, AppError> {

    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).min(50); // Cap at 50 to prevent abuse
    let tag = query.tag.clone();

    debug!("Fetching posts: page={}, per_page={}, tag={:?}", page, per_page, tag);

    // 1. Get the total count for pagination metadata
    let mut count_sql = "SELECT COUNT(*) FROM posts WHERE published = 1".to_string();
    if tag.is_some() {
        count_sql.push_str(" AND EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)");
    }
    
    let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
    if let Some(ref t) = tag {
        count_query = count_query.bind(t);
    }
    
    let total: i64 = match count_query.fetch_one(&state.db).await {
        Ok(count) => count,
        Err(e) => {
            warn!("Failed to fetch total post count, defaulting to 0. Error: {}", e);
            0
        }
    };

    // 2. Fetch the actual records
    let posts = crate::models::post::list_posts(&state.db, page, per_page, tag, true).await?;
    let posts_count = posts.len();

    // 3. Strip massive content fields from the list response for fast loading
    let posts_json: Vec<Value> = posts.into_iter().map(|p| {
        json!({
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "description": p.description,
            "tags": p.tags,
            "published": p.published,
            "reading_time_mins": p.reading_time_mins,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        })
    }).collect();

    info!("Successfully fetched {} posts (Total matching filters: {})", posts_count, total);

    Ok(Json(json!({
        "posts": posts_json,
        "total": total,
        "page": page,
        "per_page": per_page
    })))
}

pub async fn get_post(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<Value>, AppError> {

    debug!("Incoming request to fetch post: {}", slug);

    let post = crate::models::post::get_post_by_slug(&state.db, &slug).await?;
    
    // Ensure public users cannot see drafts
    if !post.published {
        // High-visibility warning for unauthorized draft access attempts
        warn!("Blocked public access to unpublished draft: {}", slug);
        return Err(AppError::NotFound("Post not found".to_string()));
    }

    info!("Successfully served post: {}", slug);

    // Include the compiled HTML for the frontend to render
    Ok(Json(json!({
        "id": post.id,
        "title": post.title,
        "slug": post.slug,
        "description": post.description,
        "tags": post.tags,
        "content_html": post.content_html,
        "published": post.published,
        "reading_time_mins": post.reading_time_mins,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    })))
}

pub async fn list_tags(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {

    debug!("Incoming request to fetch aggregated tags.");

    let tags = crate::models::post::list_tags(&state.db).await?;

    info!("Successfully fetched {} unique tags.", tags.len());

    Ok(Json(json!({
        "tags": tags
    })))
}

pub async fn rss_feed(
    State(state): State<AppState>,
) -> Result<Response, AppError> {

    debug!("Incoming request to generate RSS feed.");

    // 1. Fetch the 20 most recent published posts
    // Your list_posts model perfectly handles this: page 1, per_page 20, no tag, only_published=true
    let posts = crate::models::post::list_posts(&state.db, 1, 20, None, true).await?;

    // 2. Grab the frontend URL from the environment (default to localhost for testing)
    let base_url = std::env::var("PUBLIC_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());

    // 3. Build the XML String
    let mut xml = String::new();
    xml.push_str(r#"<?xml version="1.0" encoding="UTF-8" ?>"#);
    xml.push_str("\n<rss version=\"2.0\">");
    xml.push_str("\n  <channel>");
    xml.push_str("\n    <title>My Tech Blog</title>");
    xml.push_str(&format!("\n    <link>{}</link>", base_url));
    xml.push_str("\n    <description>Latest technical articles and tutorials.</description>");
    xml.push_str("\n    <language>en-us</language>");

    let post_count = posts.len();

    for post in posts {
        // We must escape invalid XML characters in text fields
        let clean_title = post.title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        let clean_desc = post.description.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        
        xml.push_str("\n    <item>");
        xml.push_str(&format!("\n      <title>{}</title>", clean_title));
        // Link directly to the frontend post slug
        xml.push_str(&format!("\n      <link>{}/posts/{}</link>", base_url, post.slug));
        // Use the globally unique slug as the RSS guid
        xml.push_str(&format!("\n      <guid isPermaLink=\"false\">{}</guid>", post.slug));
        xml.push_str(&format!("\n      <description>{}</description>", clean_desc));
        
        // Note: Real RSS readers prefer RFC-822 date formats, but SQLite's ISO8601 string 
        // works well enough for most modern parsers like Feedly.
        xml.push_str(&format!("\n      <pubDate>{}</pubDate>", post.created_at)); 
        xml.push_str("\n    </item>");
    }

    xml.push_str("\n  </channel>");
    xml.push_str("\n</rss>");

    info!("Successfully generated RSS feed containing {} posts.", post_count);

    // 4. Return it with the strict XML content type
    Ok((
        [(header::CONTENT_TYPE, "application/xml; charset=utf-8")],
        xml
    ).into_response())
}