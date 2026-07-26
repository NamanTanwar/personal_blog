use axum::extract::ConnectInfo;
use axum::{
    extract::State,
    http::header::{HeaderMap, SET_COOKIE},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::net::SocketAddr;

use crate::{errors::AppError, AppState};
use tracing::{debug, error, info, warn};

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

pub async fn login(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(payload): Json<LoginRequest>,
) -> Result<(HeaderMap, Json<Value>), AppError> {
    debug!("Processing login attempt for email: {}", payload.email);

    if state.rate_limiter.check_rate_limit(addr.ip()).is_err() {
        warn!("Rate limit exceeded for IP: {}", addr.ip());
        return Err(AppError::TooManyRequests);
    }

    // 1. Verify credentials using Argon 2
    // if payload.email != state.config.admin_email || payload.password != state.config.admin_password_hash {
    //     return Err(AppError::Unauthorized);
    // }
    let is_email_valid = payload.email == state.config.admin_email;
    let is_password_valid = crate::services::hash::verify_password(
        &payload.password,
        &state.config.admin_password_hash,
    );

    if !is_email_valid || !is_password_valid {
        warn!(
            "Failed login attempt for email '{}'. Invalid credentials provided.",
            payload.email
        );
        // We use a generic error message so hackers don't know
        // whether they guessed the email or the password wrong.
        return Err(AppError::Unauthorized);
    }

    // 2. Generate the JWT (valid for 24 hours)
    let token = crate::services::jwt::create_token(&state.config.jwt_secret, 24)?;

    // 3. Build the HttpOnly cookie string
    // Max-Age is in seconds (24 hours = 86400 seconds)
    // Note: If you deploy to production with HTTPS, you should also add the `Secure` flag to this string.
    let cookie_str = format!(
        "jwt={}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict",
        token
    );

    // 4. Attach the cookie to the response headers
    let mut headers = HeaderMap::new();
    headers.insert(SET_COOKIE, cookie_str.parse().unwrap());

    info!("Admin successfully authenticated. Issuing JWT cookie.");

    // 5. We no longer send the token in the JSON body!
    Ok((
        headers,
        Json(json!({ "message": "Successfully authenticated" })),
    ))
}
