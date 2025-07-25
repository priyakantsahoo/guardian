package com.example.authservice.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Rate limiting entity to track API request attempts per IP/client
 * Implements sliding window rate limiting with configurable thresholds
 */
@Entity
@Table(name = "rate_limits")
@Data
public class RateLimit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Client ID for client-specific rate limiting
     */
    @Column(name = "client_id", nullable = false)
    private String clientId;
    
    /**
     * IP address for IP-based rate limiting
     */
    @Column(name = "ip_address", nullable = false)
    private String ipAddress;
    
    /**
     * Type of operation being rate limited (LOGIN, SIGNUP, API_CALL, etc.)
     */
    @Column(name = "operation_type", nullable = false)
    private String operationType;
    
    /**
     * Current attempt count within the time window
     */
    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;
    
    /**
     * When the rate limiting window started
     */
    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;
    
    /**
     * When the rate limit was last updated
     */
    @Column(name = "last_attempt", nullable = false)
    private LocalDateTime lastAttempt;
    
    /**
     * When the rate limit should be reset (calculated field)
     */
    @Column(name = "reset_time", nullable = false)
    private LocalDateTime resetTime;
    
    /**
     * Whether this IP/client is currently blocked
     */
    @Column(name = "is_blocked", nullable = false)
    private Boolean isBlocked = false;
    
    /**
     * User agent string for additional tracking
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    /**
     * Additional context or reason for rate limiting
     */
    @Column(name = "context", length = 200)
    private String context;
    
    /**
     * Check if the rate limit window has expired
     */
    public boolean isWindowExpired(int windowMinutes) {
        if (windowStart == null) {
            return true;
        }
        LocalDateTime windowEnd = windowStart.plusMinutes(windowMinutes);
        return LocalDateTime.now().isAfter(windowEnd);
    }
    
    /**
     * Check if reset time has passed
     */
    public boolean isResetTimeReached() {
        if (resetTime == null) {
            return true;
        }
        return LocalDateTime.now().isAfter(resetTime);
    }
    
    /**
     * Reset the rate limit window
     */
    public void resetWindow(int windowMinutes) {
        this.attemptCount = 0;
        this.windowStart = LocalDateTime.now();
        this.lastAttempt = LocalDateTime.now();
        this.resetTime = LocalDateTime.now().plusMinutes(windowMinutes);
        this.isBlocked = false;
    }
    
    /**
     * Increment attempt count
     */
    public void incrementAttempts() {
        this.attemptCount++;
        this.lastAttempt = LocalDateTime.now();
    }
    
    /**
     * Block this rate limit entry
     */
    public void block(int blockDurationMinutes) {
        this.isBlocked = true;
        this.resetTime = LocalDateTime.now().plusMinutes(blockDurationMinutes);
    }
}