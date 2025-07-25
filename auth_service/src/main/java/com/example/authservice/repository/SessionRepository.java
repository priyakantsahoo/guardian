package com.example.authservice.repository;

import com.example.authservice.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    
    // Find session by JWT session ID (jti claim)
    Optional<Session> findBySessionId(String sessionId);
    
    // Find active sessions by user ID
    @Query("SELECT s FROM Session s WHERE s.userId = :userId AND s.isActive = true")
    List<Session> findActiveSessionsByUserId(@Param("userId") Long userId);
    
    // Find active sessions by client ID
    @Query("SELECT s FROM Session s WHERE s.clientId = :clientId AND s.isActive = true")
    List<Session> findActiveSessionsByClientId(@Param("clientId") String clientId);
    
    // Find sessions that have expired
    @Query("SELECT s FROM Session s WHERE s.expiresAt < :now AND s.isActive = true")
    List<Session> findExpiredSessions(@Param("now") LocalDateTime now);
    
    // Find sessions that have exceeded idle timeout
    @Query("SELECT s FROM Session s WHERE s.lastAccessedAt < :idleThreshold AND s.isActive = true")
    List<Session> findIdleTimeoutSessions(@Param("idleThreshold") LocalDateTime idleThreshold);
    
    // Deactivate session
    @Modifying
    @Query("UPDATE Session s SET s.isActive = false WHERE s.sessionId = :sessionId")
    int deactivateSession(@Param("sessionId") String sessionId);
    
    // Deactivate all sessions for a user
    @Modifying
    @Query("UPDATE Session s SET s.isActive = false WHERE s.userId = :userId")
    int deactivateAllUserSessions(@Param("userId") Long userId);
    
    // Update last accessed time
    @Modifying
    @Query("UPDATE Session s SET s.lastAccessedAt = :now WHERE s.sessionId = :sessionId")
    int updateLastAccessedTime(@Param("sessionId") String sessionId, @Param("now") LocalDateTime now);
    
    // Clean up expired and inactive sessions
    @Modifying
    @Query("DELETE FROM Session s WHERE (s.expiresAt < :now OR s.isActive = false) AND s.createdAt < :cleanupThreshold")
    int cleanupOldSessions(@Param("now") LocalDateTime now, @Param("cleanupThreshold") LocalDateTime cleanupThreshold);
    
    // Count active sessions
    @Query("SELECT COUNT(s) FROM Session s WHERE s.isActive = true AND s.expiresAt > :now")
    long countActiveSessions(@Param("now") LocalDateTime now);
}