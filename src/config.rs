use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiry_hours: i64,
    pub admin_email: String,
    pub admin_password_hash: String,
    pub aws_s3_bucket: String,
    pub aws_s3_region: String,
    pub upload_max_size_mb: u64,
    pub server_host: String,
    pub server_port: u16,
    pub public_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        // Load the .env file if it exists (fails silently in production, which is expected)
        dotenvy::dotenv().ok();

        Self {
            database_url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            jwt_secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
            jwt_expiry_hours: env::var("JWT_EXPIRY_HOURS")
                .unwrap_or_else(|_| "72".to_string())
                .parse()
                .expect("JWT_EXPIRY_HOURS must be a valid integer"),
            admin_email: env::var("ADMIN_EMAIL").expect("ADMIN_EMAIL must be set"),
            admin_password_hash: env::var("ADMIN_PASSWORD_HASH").expect("ADMIN_PASSWORD_HASH must be set"),
            aws_s3_bucket: env::var("AWS_S3_BUCKET").expect("AWS_S3_BUCKET must be set"),
            aws_s3_region: env::var("AWS_S3_REGION").expect("AWS_S3_REGION must be set"),
            upload_max_size_mb: env::var("UPLOAD_MAX_SIZE_MB")
                .unwrap_or_else(|_| "5".to_string())
                .parse()
                .expect("UPLOAD_MAX_SIZE_MB must be a valid integer"),
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "3001".to_string())
                .parse()
                .expect("SERVER_PORT must be a valid integer"),
            public_url: env::var("PUBLIC_URL").expect("PUBLIC_URL must be set"),
        }
    }
}