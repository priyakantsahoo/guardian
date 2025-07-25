package com.example.authservice.service;

import com.example.authservice.entity.Session;
import com.example.authservice.repository.SessionRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class SessionService {
    
    @Autowired
    private SessionRepository sessionRepository;
    
    @Autowired
    private ClientService clientService;
    
    @Autowired
    private SessionCacheService sessionCacheService;
    
    @Value("${jwt.expiration:3600000}") // Default 1 hour in milliseconds
    private long jwtExpirationMs;
    
    /**
     * Create a new session when user logs in
     */
    public Session createSession(Long userId, String clientId, HttpServletRequest request) {
        String sessionId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(jwtExpirationMs / 1000);
        
        Session session = new Session();
        session.setSessionId(sessionId);
        session.setUserId(userId);
        session.setClientId(clientId);
        session.setCreatedAt(now);
        session.setExpiresAt(expiresAt);
        session.setLastAccessedAt(now);
        session.setIsActive(true);
        
        // Extract request information
        if (request != null) {
            session.setUserAgent(request.getHeader("User-Agent"));
            session.setIpAddress(getClientIpAddress(request));
        }
        
        Session savedSession = sessionRepository.save(session);
        
        // Cache the new session
        sessionCacheService.putSession(sessionId, savedSession);
        
        System.out.println("✅ Created session: " + sessionId + " for user: " + userId);
        
        return savedSession;
    }
    
    /**
     * Validate session and check for idle timeout
     */
    public boolean validateSession(String sessionId, String clientId) {
        // Try to get from cache first
        Session session = sessionCacheService.getSession(sessionId);
        
        if (session == null) {
            // Fallback to database
            Optional<Session> sessionOpt = sessionRepository.findBySessionId(sessionId);
            
            if (sessionOpt.isEmpty()) {
                System.out.println("❌ Session not found: " + sessionId);
                return false;
            }
            
            session = sessionOpt.get();
            
            // Cache the session for future use
            sessionCacheService.putSession(sessionId, session);
        }
        
        // Check if session is active
        if (!session.getIsActive()) {
            System.out.println("❌ Session is inactive: " + sessionId);
            return false;
        }
        
        // Check if session belongs to the correct client
        if (!session.getClientId().equals(clientId)) {
            System.out.println("❌ Session client mismatch: " + sessionId);
            return false;
        }
        
        // Check if session has expired
        if (session.isExpired()) {
            System.out.println("❌ Session expired: " + sessionId);
            deactivateSession(sessionId);
            return false;
        }
        
        // Get client idle timeout (default 30 minutes)
        int idleTimeoutMinutes = getClientIdleTimeout(clientId);
        
        // Check idle timeout
        if (session.isIdleTimeoutExceeded(idleTimeoutMinutes)) {
            System.out.println("❌ Session idle timeout exceeded: " + sessionId);
            deactivateSession(sessionId);
            return false;
        }
        
        // Update last accessed time in both cache and database
        LocalDateTime now = LocalDateTime.now();
        updateLastAccessedTime(sessionId);
        sessionCacheService.updateLastAccessedTime(sessionId, now);
        
        System.out.println("✅ Session validated: " + sessionId);
        
        return true;
    }
    
    /**
     * Update last accessed time for a session
     */
    public void updateLastAccessedTime(String sessionId) {
        sessionRepository.updateLastAccessedTime(sessionId, LocalDateTime.now());
    }
    
    /**
     * Deactivate a session
     */
    public void deactivateSession(String sessionId) {
        int updated = sessionRepository.deactivateSession(sessionId);
        if (updated > 0) {
            // Remove from cache
            sessionCacheService.removeSession(sessionId);
            System.out.println("✅ Deactivated session: " + sessionId);
        }
    }
    
    /**
     * Deactivate all sessions for a user (useful for logout all devices)
     */
    public void deactivateAllUserSessions(Long userId) {
        // Get active sessions before deactivating to remove from cache
        List<Session> activeSessions = getActiveUserSessions(userId);
        
        int updated = sessionRepository.deactivateAllUserSessions(userId);
        
        // Remove deactivated sessions from cache
        for (Session session : activeSessions) {
            sessionCacheService.removeSession(session.getSessionId());
        }
        
        System.out.println("✅ Deactivated " + updated + " sessions for user: " + userId);
    }
    
    /**
     * Get session information by session ID
     */
    public Optional<Session> getSession(String sessionId) {
        // Try cache first
        Session cachedSession = sessionCacheService.getSession(sessionId);
        if (cachedSession != null) {
            return Optional.of(cachedSession);
        }
        
        // Fallback to database
        Optional<Session> sessionOpt = sessionRepository.findBySessionId(sessionId);
        if (sessionOpt.isPresent()) {
            // Cache the session
            sessionCacheService.putSession(sessionId, sessionOpt.get());
        }
        
        return sessionOpt;
    }
    
    /**
     * Get active sessions for a user
     */
    public List<Session> getActiveUserSessions(Long userId) {
        return sessionRepository.findActiveSessionsByUserId(userId);
    }
    
    /**
     * Clean up expired and idle sessions (should be called periodically)
     */
    public void cleanupExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        
        // Find and deactivate expired sessions
        List<Session> expiredSessions = sessionRepository.findExpiredSessions(now);
        for (Session session : expiredSessions) {
            deactivateSession(session.getSessionId());
        }
        
        // Find and deactivate idle timeout sessions
        // Check for different client idle timeouts
        LocalDateTime idleThreshold = now.minusMinutes(30); // Default 30 minutes
        List<Session> idleSessions = sessionRepository.findIdleTimeoutSessions(idleThreshold);
        for (Session session : idleSessions) {
            int clientIdleTimeout = getClientIdleTimeout(session.getClientId());
            if (session.isIdleTimeoutExceeded(clientIdleTimeout)) {
                deactivateSession(session.getSessionId());
            }
        }
        
        // Clean up old inactive sessions (older than 24 hours)
        LocalDateTime cleanupThreshold = now.minusHours(24);
        int cleaned = sessionRepository.cleanupOldSessions(now, cleanupThreshold);
        
        if (cleaned > 0) {
            System.out.println("✅ Cleaned up " + cleaned + " old sessions");
        }
    }
    
    /**
     * Get client idle timeout in minutes
     */
    private int getClientIdleTimeout(String clientId) {
        // TODO: Get from client configuration, for now use default 30 minutes
        return 30;
    }
    
    /**
     * Extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
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
}