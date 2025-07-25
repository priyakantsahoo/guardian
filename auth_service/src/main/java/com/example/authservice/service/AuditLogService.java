package com.example.authservice.service;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.authservice.entity.AuditLog;
import com.example.authservice.repository.AuditLogRepository;
import com.example.authservice.service.GeoService.GeoLocation;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private GeoService geoService;

    @Async("auditLogExecutor")
    public void logEvent(String eventType, String userEmail, String clientId, HttpServletRequest request, int status,
            String errorCode) {
        AuditLog auditLog = new AuditLog();

        // Basic event information
        auditLog.setEventType(eventType);
        auditLog.setUserEmail(userEmail);
        auditLog.setClientId(clientId);
        auditLog.setResponseStatus(status);
        auditLog.setErrorCode(errorCode);
        auditLog.setRequestId(UUID.randomUUID().toString());

        // Extract request information
        if (request != null) {
            String ipAddress = extractClientIpAddress(request);
            auditLog.setIpAddress(ipAddress);
            auditLog.setUserAgent(request.getHeader("User-Agent"));
            auditLog.setRequestMethod(request.getMethod());
            auditLog.setEndpoint(request.getRequestURI());
            
            // Get geolocation information
            GeoLocation geoLocation = geoService.getGeoLocation(ipAddress);
            auditLog.setGeoCountry(geoLocation.getCountry());
            auditLog.setGeoCity(geoLocation.getCity());
            
            // Extract session ID from JWT token
            auditLog.setSessionId(extractSessionIdFromRequest(request));
        }

        try {
            auditLogRepository.save(auditLog);
            System.out.println("📝 Audit log saved: " + eventType + " for " + userEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to save audit log: " + e.getMessage());
        }
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
     * Extract session ID from JWT token in request
     */
    private String extractSessionIdFromRequest(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.replace("Bearer ", "");
                return jwtService.getSessionIdFromToken(token);
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not extract session ID from request: " + e.getMessage());
        }
        return null;
    }
}
