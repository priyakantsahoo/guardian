package com.example.authservice.service;

import com.example.authservice.entity.RateLimit;
import com.example.authservice.repository.RateLimitRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Rate limiting service to prevent API abuse
 * Implements sliding window rate limiting with configurable thresholds
 */
@Service
public class RateLimitService {
    
    @Autowired
    private RateLimitRepository rateLimitRepository;
    
    // Rate limiting configuration
    private static final int DEFAULT_MAX_ATTEMPTS = 5;
    private static final int DEFAULT_WINDOW_MINUTES = 5;
    private static final int DEFAULT_BLOCK_DURATION_MINUTES = 15;
    
    // Operation types
    public static final String LOGIN_OPERATION = "LOGIN";
    public static final String SIGNUP_OPERATION = "SIGNUP";
    public static final String API_CALL_OPERATION = "API_CALL";
    public static final String TOKEN_VALIDATION_OPERATION = "TOKEN_VALIDATION";
    
    /**
     * Check if a request should be rate limited
     * @param request HTTP request
     * @param clientId Client ID
     * @param operationType Type of operation
     * @return RateLimitResult indicating if request is allowed
     */
    public RateLimitResult checkRateLimit(HttpServletRequest request, String clientId, String operationType) {
        String ipAddress = extractClientIpAddress(request);
        return checkRateLimit(ipAddress, clientId, operationType, request.getHeader("User-Agent"));
    }
    
    /**
     * Check if a request should be rate limited
     * @param ipAddress Client IP address
     * @param clientId Client ID
     * @param operationType Type of operation
     * @param userAgent User agent string
     * @return RateLimitResult indicating if request is allowed
     */
    @Transactional
    public RateLimitResult checkRateLimit(String ipAddress, String clientId, String operationType, String userAgent) {
        try {
            // Get or create rate limit entry
            RateLimit rateLimit = getOrCreateRateLimit(ipAddress, clientId, operationType, userAgent);
            
            // Check if currently blocked
            if (rateLimit.getIsBlocked() && !rateLimit.isResetTimeReached()) {
                System.out.println("🚫 Rate limit active for " + ipAddress + " - " + operationType + 
                                 " (resets at " + rateLimit.getResetTime() + ")");
                return new RateLimitResult(false, rateLimit.getAttemptCount(), getRemainingTime(rateLimit), 
                                         "Rate limit exceeded. Try again later.");
            }
            
            // Reset if window expired or reset time reached
            if (rateLimit.isWindowExpired(DEFAULT_WINDOW_MINUTES) || rateLimit.isResetTimeReached()) {
                rateLimit.resetWindow(DEFAULT_WINDOW_MINUTES);
                rateLimitRepository.save(rateLimit);
            }
            
            // Check current attempt count
            if (rateLimit.getAttemptCount() >= DEFAULT_MAX_ATTEMPTS) {
                // Block the rate limit
                rateLimit.block(DEFAULT_BLOCK_DURATION_MINUTES);
                rateLimitRepository.save(rateLimit);
                
                System.out.println("🚫 Rate limit exceeded for " + ipAddress + " - " + operationType + 
                                 " (" + rateLimit.getAttemptCount() + " attempts)");
                return new RateLimitResult(false, rateLimit.getAttemptCount(), getRemainingTime(rateLimit),
                                         "Too many requests. Rate limit exceeded.");
            }
            
            // Allow the request
            System.out.println("✅ Rate limit check passed for " + ipAddress + " - " + operationType + 
                             " (" + rateLimit.getAttemptCount() + "/" + DEFAULT_MAX_ATTEMPTS + " attempts)");
            return new RateLimitResult(true, rateLimit.getAttemptCount(), 0, null);
            
        } catch (Exception e) {
            System.err.println("❌ Error in rate limit check: " + e.getMessage());
            // On error, allow the request to prevent service disruption
            return new RateLimitResult(true, 0, 0, null);
        }
    }
    
    /**
     * Record a failed attempt (increment rate limit counter)
     */
    public void recordFailedAttempt(HttpServletRequest request, String clientId, String operationType) {
        String ipAddress = extractClientIpAddress(request);
        recordFailedAttempt(ipAddress, clientId, operationType, request.getHeader("User-Agent"));
    }
    
    /**
     * Record a failed attempt (increment rate limit counter)
     */
    @Transactional
    public void recordFailedAttempt(String ipAddress, String clientId, String operationType, String userAgent) {
        try {
            RateLimit rateLimit = getOrCreateRateLimit(ipAddress, clientId, operationType, userAgent);
            
            // Reset if window expired
            if (rateLimit.isWindowExpired(DEFAULT_WINDOW_MINUTES) || rateLimit.isResetTimeReached()) {
                rateLimit.resetWindow(DEFAULT_WINDOW_MINUTES);
            }
            
            // Increment attempt count
            rateLimit.incrementAttempts();
            rateLimitRepository.save(rateLimit);
            
            System.out.println("📊 Recorded failed attempt for " + ipAddress + " - " + operationType + 
                             " (" + rateLimit.getAttemptCount() + "/" + DEFAULT_MAX_ATTEMPTS + ")");
            
        } catch (Exception e) {
            System.err.println("❌ Error recording failed attempt: " + e.getMessage());
        }
    }
    
    /**
     * Get or create rate limit entry for the given parameters
     */
    private RateLimit getOrCreateRateLimit(String ipAddress, String clientId, String operationType, String userAgent) {
        Optional<RateLimit> existingOpt = rateLimitRepository.findByIpAddressAndClientIdAndOperationType(
            ipAddress, clientId, operationType);
        
        if (existingOpt.isPresent()) {
            return existingOpt.get();
        }
        
        // Create new rate limit entry
        RateLimit rateLimit = new RateLimit();
        rateLimit.setIpAddress(ipAddress);
        rateLimit.setClientId(clientId);
        rateLimit.setOperationType(operationType);
        rateLimit.setUserAgent(userAgent);
        rateLimit.resetWindow(DEFAULT_WINDOW_MINUTES);
        
        return rateLimitRepository.save(rateLimit);
    }
    
    /**
     * Get remaining time until rate limit resets (in seconds)
     */
    private long getRemainingTime(RateLimit rateLimit) {
        if (rateLimit.getResetTime() == null) {
            return 0;
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(rateLimit.getResetTime())) {
            return 0;
        }
        
        return java.time.Duration.between(now, rateLimit.getResetTime()).getSeconds();
    }
    
    /**
     * Extract client IP address from request, handling proxies
     */
    private String extractClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Clean up expired rate limits (run periodically)
     */
    @Async("taskExecutor")
    public void cleanupExpiredRateLimits() {
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Reset expired rate limits
            List<RateLimit> expiredRateLimits = rateLimitRepository.findExpiredRateLimits(now);
            for (RateLimit rateLimit : expiredRateLimits) {
                rateLimit.resetWindow(DEFAULT_WINDOW_MINUTES);
                rateLimitRepository.save(rateLimit);
            }
            
            // Clean up old entries (older than 24 hours)
            LocalDateTime cutoff = now.minusHours(24);
            int cleaned = rateLimitRepository.cleanupOldRateLimits(cutoff);
            
            if (cleaned > 0 || !expiredRateLimits.isEmpty()) {
                System.out.println("🧹 Rate limit cleanup: reset " + expiredRateLimits.size() + 
                                 " expired entries, cleaned " + cleaned + " old entries");
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error in rate limit cleanup: " + e.getMessage());
        }
    }
    
    /**
     * Get rate limit statistics for monitoring
     */
    public RateLimitStats getStats(String clientId) {
        long activeByClient = rateLimitRepository.countActiveRateLimitsByClientId(clientId);
        return new RateLimitStats(activeByClient, DEFAULT_MAX_ATTEMPTS, DEFAULT_WINDOW_MINUTES, DEFAULT_BLOCK_DURATION_MINUTES);
    }
    
    /**
     * Result of rate limit check
     */
    public static class RateLimitResult {
        private final boolean allowed;
        private final int currentAttempts;
        private final long remainingTimeSeconds;
        private final String message;
        
        public RateLimitResult(boolean allowed, int currentAttempts, long remainingTimeSeconds, String message) {
            this.allowed = allowed;
            this.currentAttempts = currentAttempts;
            this.remainingTimeSeconds = remainingTimeSeconds;
            this.message = message;
        }
        
        public boolean isAllowed() { return allowed; }
        public int getCurrentAttempts() { return currentAttempts; }
        public long getRemainingTimeSeconds() { return remainingTimeSeconds; }
        public String getMessage() { return message; }
    }
    
    /**
     * Rate limit statistics
     */
    public static class RateLimitStats {
        private final long activeRateLimits;
        private final int maxAttempts;
        private final int windowMinutes;
        private final int blockDurationMinutes;
        
        public RateLimitStats(long activeRateLimits, int maxAttempts, int windowMinutes, int blockDurationMinutes) {
            this.activeRateLimits = activeRateLimits;
            this.maxAttempts = maxAttempts;
            this.windowMinutes = windowMinutes;
            this.blockDurationMinutes = blockDurationMinutes;
        }
        
        public long getActiveRateLimits() { return activeRateLimits; }
        public int getMaxAttempts() { return maxAttempts; }
        public int getWindowMinutes() { return windowMinutes; }
        public int getBlockDurationMinutes() { return blockDurationMinutes; }
    }
}