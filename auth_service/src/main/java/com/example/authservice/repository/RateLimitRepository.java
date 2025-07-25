package com.example.authservice.repository;

import com.example.authservice.entity.RateLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for rate limiting operations
 */
@Repository
public interface RateLimitRepository extends JpaRepository<RateLimit, Long> {
    
    /**
     * Find rate limit entry for specific IP, client, and operation
     */
    @Query("SELECT r FROM RateLimit r WHERE r.ipAddress = :ipAddress AND r.clientId = :clientId AND r.operationType = :operationType")
    Optional<RateLimit> findByIpAddressAndClientIdAndOperationType(
        @Param("ipAddress") String ipAddress,
        @Param("clientId") String clientId, 
        @Param("operationType") String operationType
    );
    
    /**
     * Find rate limit entry by IP and operation only (for anonymous operations)
     */
    @Query("SELECT r FROM RateLimit r WHERE r.ipAddress = :ipAddress AND r.operationType = :operationType")
    Optional<RateLimit> findByIpAddressAndOperationType(
        @Param("ipAddress") String ipAddress,
        @Param("operationType") String operationType
    );
    
    /**
     * Find all active rate limits for a client
     */
    @Query("SELECT r FROM RateLimit r WHERE r.clientId = :clientId AND r.isBlocked = true")
    List<RateLimit> findActiveRateLimitsByClientId(@Param("clientId") String clientId);
    
    /**
     * Find all active rate limits for an IP address
     */
    @Query("SELECT r FROM RateLimit r WHERE r.ipAddress = :ipAddress AND r.isBlocked = true")
    List<RateLimit> findActiveRateLimitsByIpAddress(@Param("ipAddress") String ipAddress);
    
    /**
     * Find rate limits that should be reset (reset time has passed)
     */
    @Query("SELECT r FROM RateLimit r WHERE r.resetTime < :now")
    List<RateLimit> findExpiredRateLimits(@Param("now") LocalDateTime now);
    
    /**
     * Find rate limits with expired windows that can be cleaned up
     */
    @Query("SELECT r FROM RateLimit r WHERE r.windowStart < :cutoff AND r.isBlocked = false")
    List<RateLimit> findOldRateLimits(@Param("cutoff") LocalDateTime cutoff);
    
    /**
     * Reset rate limit (unblock and reset counters)
     */
    @Modifying
    @Query("UPDATE RateLimit r SET r.isBlocked = false, r.attemptCount = 0, r.windowStart = :now, r.resetTime = :resetTime WHERE r.id = :id")
    int resetRateLimit(@Param("id") Long id, @Param("now") LocalDateTime now, @Param("resetTime") LocalDateTime resetTime);
    
    /**
     * Block rate limit entry
     */
    @Modifying
    @Query("UPDATE RateLimit r SET r.isBlocked = true, r.resetTime = :resetTime WHERE r.id = :id")
    int blockRateLimit(@Param("id") Long id, @Param("resetTime") LocalDateTime resetTime);
    
    /**
     * Update attempt count and last attempt time
     */
    @Modifying
    @Query("UPDATE RateLimit r SET r.attemptCount = :attemptCount, r.lastAttempt = :lastAttempt WHERE r.id = :id")
    int updateAttemptCount(@Param("id") Long id, @Param("attemptCount") Integer attemptCount, @Param("lastAttempt") LocalDateTime lastAttempt);
    
    /**
     * Clean up old rate limit entries
     */
    @Modifying
    @Query("DELETE FROM RateLimit r WHERE r.windowStart < :cutoff AND r.isBlocked = false")
    int cleanupOldRateLimits(@Param("cutoff") LocalDateTime cutoff);
    
    /**
     * Count active rate limits by client
     */
    @Query("SELECT COUNT(r) FROM RateLimit r WHERE r.clientId = :clientId AND r.isBlocked = true")
    long countActiveRateLimitsByClientId(@Param("clientId") String clientId);
    
    /**
     * Count active rate limits by IP address
     */
    @Query("SELECT COUNT(r) FROM RateLimit r WHERE r.ipAddress = :ipAddress AND r.isBlocked = true")
    long countActiveRateLimitsByIpAddress(@Param("ipAddress") String ipAddress);
}