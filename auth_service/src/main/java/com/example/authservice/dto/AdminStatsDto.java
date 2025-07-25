package com.example.authservice.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO for admin dashboard statistics
 */
public class AdminStatsDto {
    private long totalUsers;
    private long totalClients;
    private long activeSessions;
    private long totalAuditLogs;
    private long activeRateLimits;
    private LocalDateTime lastStatsUpdate;
    private Map<String, Long> usersByClient;
    private Map<String, Long> loginsByDay;
    private Map<String, Long> signupsByDay;
    private Map<String, Long> auditEventTypes;
    
    // Constructors
    public AdminStatsDto() {
        this.lastStatsUpdate = LocalDateTime.now();
    }
    
    // Getters and Setters
    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    
    public long getTotalClients() { return totalClients; }
    public void setTotalClients(long totalClients) { this.totalClients = totalClients; }
    
    public long getActiveSessions() { return activeSessions; }
    public void setActiveSessions(long activeSessions) { this.activeSessions = activeSessions; }
    
    public long getTotalAuditLogs() { return totalAuditLogs; }
    public void setTotalAuditLogs(long totalAuditLogs) { this.totalAuditLogs = totalAuditLogs; }
    
    public long getActiveRateLimits() { return activeRateLimits; }
    public void setActiveRateLimits(long activeRateLimits) { this.activeRateLimits = activeRateLimits; }
    
    public LocalDateTime getLastStatsUpdate() { return lastStatsUpdate; }
    public void setLastStatsUpdate(LocalDateTime lastStatsUpdate) { this.lastStatsUpdate = lastStatsUpdate; }
    
    public Map<String, Long> getUsersByClient() { return usersByClient; }
    public void setUsersByClient(Map<String, Long> usersByClient) { this.usersByClient = usersByClient; }
    
    public Map<String, Long> getLoginsByDay() { return loginsByDay; }
    public void setLoginsByDay(Map<String, Long> loginsByDay) { this.loginsByDay = loginsByDay; }
    
    public Map<String, Long> getSignupsByDay() { return signupsByDay; }
    public void setSignupsByDay(Map<String, Long> signupsByDay) { this.signupsByDay = signupsByDay; }
    
    public Map<String, Long> getAuditEventTypes() { return auditEventTypes; }
    public void setAuditEventTypes(Map<String, Long> auditEventTypes) { this.auditEventTypes = auditEventTypes; }
}