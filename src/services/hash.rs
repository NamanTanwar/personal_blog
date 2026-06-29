use argon2::{
    password_hash::{PasswordHash, PasswordVerifier},
    Argon2,
};

pub fn verify_password(plain_password: &str, hashed_password: &str) -> bool {
    // 1. Parse the string from the .env file into a secure Hash object
    let parsed_hash = match PasswordHash::new(hashed_password) {
        Ok(hash) => hash,
        Err(_) => return false, // If the .env hash is malformed, reject the login
    };

    // 2. Cryptographically compare the provided password against the hash
    Argon2::default()
        .verify_password(plain_password.as_bytes(), &parsed_hash)
        .is_ok()
}