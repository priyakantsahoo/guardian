package com.example.authservice.service;

import com.example.authservice.entity.Session;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * In-memory cache for active sessions to improve performance
 * Reduces database queries for session validation
 */
@Service
public class SessionCacheService {
    
    private final ConcurrentHashMap<String, Session> sessionCache = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();
    
    public SessionCacheService() {
        // Schedule cache cleanup every 5 minutes
        cleanupExecutor.scheduleWithFixedDelay(this::cleanupExpiredSessions, 5, 5, TimeUnit.MINUTES);
    }
    
    /**
     * Get session from cache
     */
    public Session getSession(String sessionId) {
        return sessionCache.get(sessionId);
    }
    
    /**
     * Put session in cache
     */
    public void putSession(String sessionId, Session session) {
        sessionCache.put(sessionId, session);
        System.out.println("📦 Cached session: " + sessionId);
    }
    
    /**
     * Remove session from cache
     */
    public void removeSession(String sessionId) {
        Session removed = sessionCache.remove(sessionId);
        if (removed != null) {
            System.out.println("🗑️ Removed session from cache: " + sessionId);
        }
    }
    
    /**
     * Check if session exists in cache
     */
    public boolean containsSession(String sessionId) {
        return sessionCache.containsKey(sessionId);
    }
    
    /**
     * Update session's last accessed time in cache
     */
    public void updateLastAccessedTime(String sessionId, LocalDateTime lastAccessedAt) {
        Session session = sessionCache.get(sessionId);
        if (session != null) {
            session.setLastAccessedAt(lastAccessedAt);
            System.out.println("🔄 Updated cache session last access: " + sessionId);
        }
    }
    
    /**
     * Clear all sessions from cache
     */
    public void clearCache() {
        int size = sessionCache.size();
        sessionCache.clear();
        System.out.println("🧹 Cleared " + size + " sessions from cache");
    }
    
    /**
     * Get cache size
     */
    public int getCacheSize() {
        return sessionCache.size();
    }
    
    /**
     * Clean up expired sessions from cache
     */
    private void cleanupExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        final int[] removed = {0}; // Use array to make it effectively final
        
        sessionCache.entrySet().removeIf(entry -> {
            Session session = entry.getValue();
            boolean shouldRemove = session.isExpired() || !session.getIsActive();
            if (shouldRemove) {
                removed[0]++;
            }
            return shouldRemove;
        });
        
        if (removed[0] > 0) {
            System.out.println("🧹 Cleaned up " + removed[0] + " expired sessions from cache");
        }
    }
    
    /**
     * Shutdown cleanup executor
     */
    public void shutdown() {
        cleanupExecutor.shutdown();
        try {
            if (!cleanupExecutor.awaitTermination(60, TimeUnit.SECONDS)) {
                cleanupExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            cleanupExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}