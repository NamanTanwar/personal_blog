use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous},
    SqlitePool,
};
use std::str::FromStr;
use crate::config::Config;
use tracing::{info, debug, error};

pub async fn establish_connection(config: &Config) -> SqlitePool {

    info!("Initializing database connection...");
    
    // We use debug! here so the DB path doesn't spam production logs
    debug!("Parsing connection string for SQLite...");

    // Parse the connection string and configure SQLite for high concurrency
    let connection_options = SqliteConnectOptions::from_str(&config.database_url)
        .expect("Invalid database URL format")
        .create_if_missing(true)
        // WAL mode is crucial for backend performance
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal);

    // Create the connection pool
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connection_options)
        .await
        .expect("Failed to connect to SQLite database");

    info!("Database pool created");

    println!("Running database migrations...");
    // The migrate! macro bakes your SQL files into the binary at compile time
    // and executes them if the database is out of date.
    match sqlx::migrate!("./migrations").run(&pool).await {
        Ok(_) => info!("✅ Database connected and migrated successfully!"),
        Err(e) => {
            error!("CRITICAL: Failed to run database migrations: {:?}", e);
            panic!("Cannot start server without successful database migrations.");
        }
    }
    
    pool
}