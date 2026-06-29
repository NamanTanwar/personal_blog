use axum::{
    extract::{Request, State},
    http::header::COOKIE,
    middleware::Next,
    response::Response,
};
use tracing::{debug, warn};

use crate::{errors::AppError, AppState};

pub async fn require_auth(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Result<Response, AppError> {
    
    // 1. Extract the raw Cookie header
    let cookie_header = req
        .headers()
        .get(COOKIE)
        .and_then(|val| val.to_str().ok())
        .ok_or_else(|| {
            warn!("Blocked unauthorized access attempt: Missing Cookie header entirely.");
            AppError::Unauthorized
        })?;

    // 2. Parse out the "jwt=" value
    let mut token = None;
    for cookie in cookie_header.split(';') {
        let cookie = cookie.trim();
        if let Some(jwt_val) = cookie.strip_prefix("jwt=") {
            token = Some(jwt_val);
            break;
        }
    }

    let token = token.ok_or_else(|| {
        warn!("Blocked unauthorized access attempt: JWT not found in cookies.");
        AppError::Unauthorized
    })?;

    // 3. Cryptographically validate the token against our secret
    if let Err(e) = crate::services::jwt::validate_token(&state.config.jwt_secret, token) {
        warn!("Blocked unauthorized access attempt: Invalid or expired JWT. Error: {:?}", e);
        return Err(AppError::Unauthorized);
    }

    debug!("Authentication successful. Opening the VIP door.");

    // 4. If everything is valid, allow the request to proceed to the final handler
    Ok(next.run(req).await)
}