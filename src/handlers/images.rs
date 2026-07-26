use axum::{
    extract::{Multipart, State},
    Json,
};
use serde::Serialize;
use tracing::{debug, error};

use crate::errors::AppError;
use crate::services::storage;
use crate::AppState;

#[derive(Serialize)]
pub struct ImageResponse {
    pub url: String,
}

pub async fn upload_image(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<ImageResponse>, AppError> {
    // 1. Extract the file from the multipart request
    let mut file_bytes: Option<Vec<u8>> = None;
    let mut content_type: Option<String> = None;
    let mut file_name: Option<String> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| AppError::BadRequest("Invalid multipart data".into()))?
    {
        if field.name() == Some("image") {
            content_type = field.content_type().map(|s| s.to_string());
            file_name = field.file_name().map(|s| s.to_string());
            file_bytes = Some(
                field
                    .bytes()
                    .await
                    .map_err(|_| AppError::BadRequest("Failed to read file".into()))?
                    .to_vec(),
            );
        }
    }

    let bytes =
        file_bytes.ok_or_else(|| AppError::BadRequest("No image field in request".into()))?;
    let content_type =
        content_type.ok_or_else(|| AppError::BadRequest("Missing content type".into()))?;

    debug!(
        "Upload request: type={}, size={}KB",
        content_type,
        bytes.len() / 1024
    );

    // 2. Validate
    storage::validate_content_type(&content_type).map_err(|e| AppError::BadRequest(e))?;
    storage::validate_file_size(bytes.len(), state.config.upload_max_size_mb)
        .map_err(|e| AppError::BadRequest(e))?;

    // 3. Generate unique key and upload
    let filename = storage::generate_filename(&file_name, &content_type);
    let key = format!("images/{}", filename);

    debug!("Uploading to S3: {}", key);

    let result = storage::upload_to_s3(
        &state.s3_client,
        &state.config.aws_s3_bucket,
        &state.config.aws_s3_region,
        &key,
        bytes,
        &content_type,
    )
    .await
    .map_err(|e| {
        error!("S3 upload failed: {}", e);
        AppError::Internal(e)
    })?;

    debug!("Upload successful: {}", result.url);

    Ok(Json(ImageResponse { url: result.url }))
}
