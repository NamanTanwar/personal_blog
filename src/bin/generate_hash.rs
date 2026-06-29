use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use std::io::{self, Write};

fn main() {
    print!("Enter the password you want to hash: ");
    io::stdout().flush().unwrap();

    let mut password = String::new();
    io::stdin().read_line(&mut password).unwrap();
    let password = password.trim();

    // Generate a secure, random salt
    let salt = SaltString::generate(&mut OsRng);

    // Hash the password using Argon2id (the default and most secure variant)
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .expect("Failed to hash password")
        .to_string();

    println!("\n✅ Success! Copy the string below into your .env file:\n");
    println!("ADMIN_PASSWORD_HASH='{}'\n", password_hash);
}