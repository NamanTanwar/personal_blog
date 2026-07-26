use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client as S3Client;
use rand::Rng;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct UploadResult {
    pub url: String,
}

/// Validates that the content type is an allowed image format.
/// Returns Ok(()) if valid, Err with a message if not.
pub fn validate_content_type(content_type: &str) -> Result<(), String> {
    let allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if allowed.contains(&content_type) {
        Ok(())
    } else {
        Err(format!(
            "Invalid file type: {}. Allowed: jpeg, png, gif, webp",
            content_type
        ))
    }
}

/// Validates that the file size is within the configured limit.
pub fn validate_file_size(size: usize, max_mb: usize) -> Result<(), String> {
    let max_bytes = max_mb * 1024 * 1024;
    if size <= max_bytes {
        Ok(())
    } else {
        Err(format!("File too large. Max: {}MB", max_mb))
    }
}

/// Generates a unique filename: {timestamp}-{random_hex}.{extension}
/// The timestamp makes files sortable by upload time.
/// The random hex prevents collisions if two uploads happen in the same second.
pub fn generate_filename(original_name: &Option<String>, content_type: &str) -> String {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let mut rng = rand::thread_rng();
    let random_hex: String = (0..8).map(|_| format!("{:02x}", rng.gen::<u8>())).collect();

    // Try to get extension from original filename, fall back to content type
    let extension = original_name
        .as_ref()
        .and_then(|name| name.rsplit('.').next())
        .unwrap_or_else(|| match content_type {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/gif" => "gif",
            "image/webp" => "webp",
            _ => "bin",
        });

    format!("{}-{}.{}", timestamp, random_hex, extension)
}

/// Uploads bytes to S3 and returns the public URL.
pub async fn upload_to_s3(
    client: &S3Client,
    bucket: &str,
    region: &str,
    key: &str,
    bytes: Vec<u8>,
    content_type: &str,
) -> Result<UploadResult, String> {
    client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(ByteStream::from(bytes))
        .content_type(content_type)
        .send()
        .await
        .map_err(|e| format!("S3 upload failed: {}", e))?;

    let url = format!("https://{}.s3.{}.amazonaws.com/{}", bucket, region, key);

    Ok(UploadResult { url })
}

#[cfg(test)]
mod tests {
    use super::*;
 
    // ═══════════════════════════════════════════════════
    // Content Type Validation
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_valid_content_types() {
        assert!(validate_content_type("image/jpeg").is_ok());
        assert!(validate_content_type("image/png").is_ok());
        assert!(validate_content_type("image/gif").is_ok());
        assert!(validate_content_type("image/webp").is_ok());
    }
 
    #[test]
    fn test_invalid_content_types() {
        assert!(validate_content_type("text/plain").is_err());
        assert!(validate_content_type("application/pdf").is_err());
        assert!(validate_content_type("image/svg+xml").is_err());
        assert!(validate_content_type("video/mp4").is_err());
        assert!(validate_content_type("").is_err());
    }
 
    #[test]
    fn test_invalid_content_type_error_message() {
        let result = validate_content_type("text/plain");
        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("text/plain"));
        assert!(error.contains("Allowed"));
    }
 
    // ═══════════════════════════════════════════════════
    // File Size Validation
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_file_size_within_limit() {
        // 1 MB file with 5 MB limit
        assert!(validate_file_size(1_048_576, 5).is_ok());
    }
 
    #[test]
    fn test_file_size_at_exact_limit() {
        // Exactly 5 MB with 5 MB limit
        assert!(validate_file_size(5 * 1024 * 1024, 5).is_ok());
    }
 
    #[test]
    fn test_file_size_over_limit() {
        // 6 MB file with 5 MB limit
        assert!(validate_file_size(6 * 1024 * 1024, 5).is_err());
    }
 
    #[test]
    fn test_file_size_zero() {
        assert!(validate_file_size(0, 5).is_ok());
    }
 
    #[test]
    fn test_file_size_error_message() {
        let result = validate_file_size(6 * 1024 * 1024, 5);
        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("5MB"));
    }
 
    // ═══════════════════════════════════════════════════
    // Filename Generation
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_filename_with_original_name() {
        let filename = generate_filename(&Some("photo.jpg".to_string()), "image/jpeg");
        assert!(filename.ends_with(".jpg"));
        assert!(filename.contains("-")); // timestamp-randomhex.ext
    }
 
    #[test]
    fn test_filename_without_original_name() {
        let filename = generate_filename(&None, "image/png");
        assert!(filename.ends_with(".png"));
    }
 
    #[test]
    fn test_filename_fallback_extensions() {
        assert!(generate_filename(&None, "image/jpeg").ends_with(".jpg"));
        assert!(generate_filename(&None, "image/png").ends_with(".png"));
        assert!(generate_filename(&None, "image/gif").ends_with(".gif"));
        assert!(generate_filename(&None, "image/webp").ends_with(".webp"));
        assert!(generate_filename(&None, "unknown/type").ends_with(".bin"));
    }
 
    #[test]
    fn test_filename_uniqueness() {
        let f1 = generate_filename(&None, "image/png");
        let f2 = generate_filename(&None, "image/png");
        // Two filenames generated in quick succession should differ
        // (due to random hex, even if timestamp is same)
        assert_ne!(f1, f2);
    }
 
    #[test]
    fn test_filename_format() {
        let filename = generate_filename(&None, "image/png");
        let parts: Vec<&str> = filename.split('.').collect();
        assert_eq!(parts.len(), 2); // name.ext
 
        let name_parts: Vec<&str> = parts[0].split('-').collect();
        assert_eq!(name_parts.len(), 2); // timestamp-randomhex
 
        // Timestamp should be numeric
        assert!(name_parts[0].parse::<u64>().is_ok());
 
        // Random hex should be 16 chars (8 bytes × 2 hex chars each)
        assert_eq!(name_parts[1].len(), 16);
    }
}
