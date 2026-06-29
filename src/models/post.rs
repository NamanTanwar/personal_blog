use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use crate::errors::AppError;
use tracing::{info,error, debug};

// ---------------------------------------------------
// 1. Structs (Data Models)
// ---------------------------------------------------

#[derive(Debug, Serialize, FromRow, Clone)]
pub struct Post {
    pub id: String,
    pub title: String,
    pub slug: String,
    pub description: String,
    // sqlx::types::Json automatically handles converting the DB text into a Rust Vec
    pub tags: sqlx::types::Json<Vec<String>>,
    pub content_md: String,
    pub content_html: String,
    pub published: bool,
    pub reading_time_mins: i64, // SQLite uses i64 for integers
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePost {
    pub title: String,
    pub slug: Option<String>,
    pub description: String,
    pub tags: Vec<String>,
    pub content_md: String,
    pub published: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePost {
    pub title: Option<String>,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub content_md: Option<String>,
    pub published: Option<bool>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct TagCount {
    pub name: String,
    pub count: i64,
}




// ---------------------------------------------------
// 2. Database Operations
// ---------------------------------------------------

/// Inserts a fully constructed Post into the database.
pub async fn insert_post(pool: &SqlitePool, post: &Post) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO posts (
            id, title, slug, description, tags, content_md, content_html, 
            published, reading_time_mins, created_at, updated_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&post.id)
    .bind(&post.title)
    .bind(&post.slug)
    .bind(&post.description)
    .bind(&post.tags)
    .bind(&post.content_md)
    .bind(&post.content_html)
    .bind(post.published)
    .bind(post.reading_time_mins)
    .bind(&post.created_at)
    .bind(&post.updated_at)
    .execute(pool)
    .await
    .map_err(|e| {
        // Catch SQLite unique constraint violations (e.g., duplicate slug)
        if let sqlx::Error::Database(db_err) = &e {
            if db_err.is_unique_violation() {
                return AppError::Conflict;
            }
        }
        AppError::Internal(e.to_string())
    })?;

    Ok(())
}

/// Fetches a single post by its slug.
pub async fn get_post_by_slug(pool: &SqlitePool, slug: &str) -> Result<Post, AppError> {
    let post = sqlx::query_as::<_, Post>(
        "SELECT * FROM posts WHERE slug = ?"
    )
    .bind(slug)
    .fetch_optional(pool)
    .await
    .map_err(|e|{
        error!("Database error while fetching post '{}': {:?}", slug, e);
        AppError::Internal(e.to_string())
    })?;

    // Convert Option<Post> into a 404 AppError if it doesn't exist
    post.ok_or_else(|| {
        // We use debug! instead of warn! because users mistyping URLs is normal 
        // and shouldn't trigger high-level server alarms.
        debug!("Post with slug '{}' not found in database.", slug);
        AppError::NotFound("Post not found".to_string())
    })
}

/// Deletes a post entirely.
pub async fn delete_post(pool: &SqlitePool, slug: &str) -> Result<(), AppError> {
    let result = sqlx::query(
        "DELETE FROM posts WHERE slug = ?"
    )
    .bind(slug)
    .execute(pool)
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Post not found".to_string()));
    }

    Ok(())
}

/// Updates a post using a full replacement strategy.
pub async fn update_post(pool: &SqlitePool, post: &Post) -> Result<(), AppError> {
    sqlx::query(
        r#"
        UPDATE posts SET 
            title = ?, slug = ?, description = ?, tags = ?, content_md = ?, 
            content_html = ?, published = ?, reading_time_mins = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(&post.title)
    .bind(&post.slug)
    .bind(&post.description)
    .bind(&post.tags)
    .bind(&post.content_md)
    .bind(&post.content_html)
    .bind(post.published)
    .bind(post.reading_time_mins)
    .bind(&post.updated_at)
    .bind(&post.id) // The WHERE clause
    .execute(pool)
    .await
    .map_err(|e| {
        if let sqlx::Error::Database(db_err) = &e {
            if db_err.is_unique_violation() {
                info!("Post update rejected: Slug '{}' already exists.", post.slug);
                return AppError::Conflict;
            }
        }

        error!("Database error while updating post '{}': {:?}", post.id, e);
        AppError::Internal(e.to_string())
    })?;

    Ok(())
}

/// Fetches paginated posts, optionally filtering by tag and published status.
pub async fn list_posts(
    pool: &SqlitePool,
    page: u32,
    per_page: u32,
    tag: Option<String>,
    only_published: bool,
) -> Result<Vec<Post>, AppError> {
    let offset = (page.saturating_sub(1)) * per_page;

    // We build the query dynamically depending on filters
    let mut query = String::from("SELECT * FROM posts WHERE 1=1");
    
    if only_published {
        query.push_str(" AND published = 1");
    }

    // SQLite's json_each allows us to look inside the JSON array string!
    if tag.is_some() {
        query.push_str(" AND EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)");
    }

    query.push_str(" ORDER BY created_at DESC LIMIT ? OFFSET ?");

    let mut sqlx_query = sqlx::query_as::<_, Post>(&query);

    if let Some(t) = tag {
        sqlx_query = sqlx_query.bind(t);
    }

    let posts = sqlx_query
        .bind(per_page)
        .bind(offset)
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(posts)
}

/// Aggregates all tags across published posts.
pub async fn list_tags(pool: &SqlitePool) -> Result<Vec<TagCount>, AppError> {
    let tags: Vec<TagCount> = sqlx::query_as::<_, TagCount>(
        r#"
        SELECT value AS name, COUNT(*) as count 
        FROM posts, json_each(posts.tags) 
        WHERE published = 1 
        GROUP BY value 
        ORDER BY count DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Database error while aggregating tags: {:?}", e); 
        AppError::Internal(e.to_string())
    }
    )?;

    Ok(tags)
}

pub async fn create_post(
    pool: &sqlx::SqlitePool,
    id: String,
    title: String,
    slug: String,
    description: String,
    content_md: String,
    content_html: String,
    tags_json: String,
    published: bool,
    reading_time_mins: u32,
) -> Result<String, AppError> {
    
    let result = sqlx::query!(
        r#"
        INSERT INTO posts (
            id, title, slug, description, content_md, content_html, 
            tags, published, reading_time_mins, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
        "#,
        id, title, slug, description, content_md, content_html, 
        tags_json, published, reading_time_mins
    )
    .fetch_one(pool)
    .await
    .map_err(|e| {
        // If the slug already exists, SQLite will throw a unique constraint error
        if e.to_string().contains("UNIQUE constraint failed") {
            // We use info! here instead of error! because users accidentally 
            // reusing a title is a normal mistake, not a server crash.
            tracing::info!("Post creation rejected: Slug '{}' already exists.", slug);
            AppError::Internal("A post with this slug already exists".into())
        } else {
            error!("Database error while inserting new post '{}': {:?}", slug, e);
            AppError::Internal(e.to_string())
        }
    })?;

    Ok(result.id)
}


pub async fn get_post_by_id(pool: &sqlx::SqlitePool, id: &str) -> Result<Post, AppError> {
    let post = sqlx::query_as::<_, Post>(
        "SELECT * FROM posts WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Database error fetching post by ID '{}': {:?}", id, e);
        AppError::Internal(e.to_string())
    })?;

    post.ok_or_else(|| {
        debug!("Update failed: Post ID '{}' not found.", id);
        AppError::NotFound("Post not found".to_string())
    })
}


