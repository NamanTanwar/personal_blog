use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::errors::AppError;

/// The data embedded inside the JWT
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // Subject (who this token belongs to)
    pub exp: usize,  // Expiration time (UNIX timestamp)
    pub iat: usize,  // Issued at (UNIX timestamp)
}

/// Generates a new JWT for the admin
pub fn create_token(secret: &str, expiry_hours: i64) -> Result<String, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::Internal(e.to_string()))?
        .as_secs() as usize;

    let exp = now + (expiry_hours as usize * 3600);

    let claims = Claims {
        sub: "admin".to_string(),
        exp,
        iat: now,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .map_err(|e| AppError::Internal(format!("Failed to create token: {}", e)))
}

/// Validates a token string and extracts the claims
pub fn validate_token(secret: &str, token: &str) -> Result<Claims, AppError> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(), // Automatically checks that 'exp' hasn't passed
    )
    .map_err(|_| AppError::Unauthorized)?; // If anything goes wrong, reject them

    Ok(token_data.claims)
}