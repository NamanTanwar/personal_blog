use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::Mutex;
use std::time::Instant;

pub struct RateLimiter {
    /// Maps each IP to a list of attempt timestamps
    attempts: Mutex<HashMap<IpAddr, Vec<Instant>>>,
    /// Maximum attempts allowed within the window
    max_attempts: usize,
    /// Window duration in seconds
    window_secs: u64,
}

impl RateLimiter {
    pub fn new(max_attempts: usize, window_secs: u64) -> Self {
        Self {
            attempts: Mutex::new(HashMap::new()),
            max_attempts,
            window_secs,
        }
    }

    /// Returns Ok(()) if the request is allowed, Err(()) if rate limited.
    pub fn check_rate_limit(&self, ip: IpAddr) -> Result<(), ()> {
        let mut attempts = self.attempts.lock().unwrap();
        let now = Instant::now();
        let window = std::time::Duration::from_secs(self.window_secs);

        // Get or create the entry for this IP
        let timestamps = attempts.entry(ip).or_insert_with(Vec::new);

        // Remove timestamps outside the window
        timestamps.retain(|t| now.duration_since(*t) < window);

        // Check if over the limit
        if timestamps.len() >= self.max_attempts {
            return Err(());
        }

        // Record this attempt
        timestamps.push(now);

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr};
    use std::thread;
    use std::time::Duration;
 
    fn test_ip(last_octet: u8) -> IpAddr {
        IpAddr::V4(Ipv4Addr::new(192, 168, 1, last_octet))
    }
 
    // ═══════════════════════════════════════════════════
    // Basic Rate Limiting
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_first_request_allowed() {
        let limiter = RateLimiter::new(5, 60);
        assert!(limiter.check_rate_limit(test_ip(1)).is_ok());
    }
 
    #[test]
    fn test_requests_within_limit_allowed() {
        let limiter = RateLimiter::new(5, 60);
        let ip = test_ip(1);
 
        for _ in 0..5 {
            assert!(limiter.check_rate_limit(ip).is_ok());
        }
    }
 
    #[test]
    fn test_request_over_limit_rejected() {
        let limiter = RateLimiter::new(5, 60);
        let ip = test_ip(1);
 
        // Use up all 5 attempts
        for _ in 0..5 {
            assert!(limiter.check_rate_limit(ip).is_ok());
        }
 
        // 6th attempt should be rejected
        assert!(limiter.check_rate_limit(ip).is_err());
    }
 
    #[test]
    fn test_different_ips_have_separate_limits() {
        let limiter = RateLimiter::new(2, 60);
 
        let ip1 = test_ip(1);
        let ip2 = test_ip(2);
 
        // Use up ip1's limit
        assert!(limiter.check_rate_limit(ip1).is_ok());
        assert!(limiter.check_rate_limit(ip1).is_ok());
        assert!(limiter.check_rate_limit(ip1).is_err());
 
        // ip2 should still be allowed
        assert!(limiter.check_rate_limit(ip2).is_ok());
        assert!(limiter.check_rate_limit(ip2).is_ok());
        assert!(limiter.check_rate_limit(ip2).is_err());
    }
 
    // ═══════════════════════════════════════════════════
    // Window Expiry
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_requests_allowed_after_window_expires() {
        // Use a 1-second window for fast testing
        let limiter = RateLimiter::new(2, 1);
        let ip = test_ip(1);
 
        // Use up the limit
        assert!(limiter.check_rate_limit(ip).is_ok());
        assert!(limiter.check_rate_limit(ip).is_ok());
        assert!(limiter.check_rate_limit(ip).is_err());
 
        // Wait for the window to expire
        thread::sleep(Duration::from_millis(1100));
 
        // Should be allowed again
        assert!(limiter.check_rate_limit(ip).is_ok());
    }
 
    // ═══════════════════════════════════════════════════
    // Edge Cases
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_limit_of_one() {
        let limiter = RateLimiter::new(1, 60);
        let ip = test_ip(1);
 
        assert!(limiter.check_rate_limit(ip).is_ok());
        assert!(limiter.check_rate_limit(ip).is_err());
    }
 
    #[test]
    fn test_many_different_ips() {
        let limiter = RateLimiter::new(3, 60);
 
        // 100 different IPs should all get their own limits
        for i in 0..100 {
            let ip = IpAddr::V4(Ipv4Addr::new(10, 0, (i / 256) as u8, (i % 256) as u8));
            assert!(limiter.check_rate_limit(ip).is_ok());
        }
    }
 
    #[test]
    fn test_rejected_requests_dont_count() {
        let limiter = RateLimiter::new(2, 1);
        let ip = test_ip(1);
 
        // Use up the limit
        assert!(limiter.check_rate_limit(ip).is_ok());
        assert!(limiter.check_rate_limit(ip).is_ok());
 
        // These rejections should NOT push timestamps
        assert!(limiter.check_rate_limit(ip).is_err());
        assert!(limiter.check_rate_limit(ip).is_err());
        assert!(limiter.check_rate_limit(ip).is_err());
 
        // Wait for window to expire
        thread::sleep(Duration::from_millis(1100));
 
        // Should be allowed again (rejected attempts didn't extend the window)
        assert!(limiter.check_rate_limit(ip).is_ok());
    }
}
