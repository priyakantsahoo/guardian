package com.example.authservice.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Data
public class Session {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "jti", unique = true, nullable = false)
    private String sessionId; // This will be the JWT 'jti' claim
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "client_id", nullable = false)
    private String clientId;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "last_activity", nullable = false)
    private LocalDateTime lastAccessedAt;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    // Helper method to check if session is expired
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    // Helper method to check if session is idle timeout exceeded
    public boolean isIdleTimeoutExceeded(int idleTimeoutMinutes) {
        if (lastAccessedAt == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(lastAccessedAt.plusMinutes(idleTimeoutMinutes));
    }
}