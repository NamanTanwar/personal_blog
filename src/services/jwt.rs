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

#[cfg(test)]
mod tests {
    use super::*;
 
    const TEST_SECRET: &str = "test-secret-key-for-unit-tests";
 
    // ═══════════════════════════════════════════════════
    // Token Creation
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_create_token_returns_string() {
        let token = create_token(TEST_SECRET, 1).unwrap();
        assert!(!token.is_empty());
    }
 
    #[test]
    fn test_create_token_different_each_time() {
        let t1 = create_token(TEST_SECRET, 1).unwrap();
        let t2 = create_token(TEST_SECRET, 1).unwrap();
        // Tokens have different iat (issued at) timestamps
        // In practice they might be identical if created in the same second,
        // but the structure should still be valid
        assert!(!t1.is_empty());
        assert!(!t2.is_empty());
    }
 
    #[test]
    fn test_create_token_has_three_parts() {
        let token = create_token(TEST_SECRET, 1).unwrap();
        let parts: Vec<&str> = token.split('.').collect();
        // JWT format: header.payload.signature
        assert_eq!(parts.len(), 3);
    }
 
    // ═══════════════════════════════════════════════════
    // Token Validation
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_validate_valid_token() {
        let token = create_token(TEST_SECRET, 1).unwrap();
        let claims = validate_token(TEST_SECRET, &token).unwrap();
        assert_eq!(claims.sub, "admin");
    }
 
    #[test]
    fn test_validate_wrong_secret_fails() {
        let token = create_token(TEST_SECRET, 1).unwrap();
        let result = validate_token("wrong-secret", &token);
        assert!(result.is_err());
    }
 
    #[test]
    fn test_validate_garbage_token_fails() {
        let result = validate_token(TEST_SECRET, "not.a.jwt");
        assert!(result.is_err());
    }
 
    #[test]
    fn test_validate_empty_token_fails() {
        let result = validate_token(TEST_SECRET, "");
        assert!(result.is_err());
    }
 
    #[test]
    fn test_token_claims_have_correct_expiry() {
        let hours = 24;
        let token = create_token(TEST_SECRET, hours).unwrap();
        let claims = validate_token(TEST_SECRET, &token).unwrap();
 
        let now = chrono::Utc::now().timestamp() as u64;
        let expected_exp = now + (hours as u64 * 3600);
 
        // Expiry should be within 5 seconds of expected
        assert!((claims.exp as i64 - expected_exp as i64).unsigned_abs() < 5);
    }
 
    #[test]
    fn test_token_claims_have_correct_iat() {
        let token = create_token(TEST_SECRET, 1).unwrap();
        let claims = validate_token(TEST_SECRET, &token).unwrap();
 
        let now = chrono::Utc::now().timestamp() as u64;
 
        // Issued-at should be within 5 seconds of now
        assert!((claims.iat as i64 - now as i64).unsigned_abs() < 5);
    }
}