use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use tracing::error;

#[derive(Debug)]
pub enum AppError {
    Conflict,
    Unauthorized,
    BadRequest(String),
    TooManyRequests,
    Internal(String),
    NotFound(String),
}

// This tells Axum how to turn our AppError into an HTTP response
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            // Updated to accept the custom message
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),

            AppError::Conflict => (StatusCode::CONFLICT, "Slug already taken".to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => {
                // Log the real, detailed error for the backend console
                error!("Internal server error: {}", msg);
                // Return a generic error to the frontend/user to prevent leaking internals
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
            AppError::TooManyRequests => (
                StatusCode::TOO_MANY_REQUESTS,
                "Too many login attempts. Please try again later.".to_string(),
            ),
        };

        // Format the response body to match the spec: { "error": "message" }
        let body = Json(json!({
            "error": error_message
        }));

        (status, body).into_response()
    }
}
