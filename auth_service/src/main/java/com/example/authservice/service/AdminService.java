package com.example.authservice.service;

import com.example.authservice.dto.AdminStatsDto;
import com.example.authservice.dto.AdminUserDto;
import com.example.authservice.entity.AuditLog;
import com.example.authservice.entity.Client;
import com.example.authservice.entity.Session;
import com.example.authservice.entity.User;
import com.example.authservice.repository.AuditLogRepository;
import com.example.authservice.repository.ClientRepository;
import com.example.authservice.repository.RateLimitRepository;
import com.example.authservice.repository.SessionRepository;
import com.example.authservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for admin operations and dashboard functionality
 */
@Service
@Transactional
public class AdminService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ClientRepository clientRepository;
    
    @Autowired
    private SessionRepository sessionRepository;
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private RateLimitRepository rateLimitRepository;
    
    @Autowired
    private SessionService sessionService;
    
    /**
     * Get comprehensive dashboard statistics
     */
    public AdminStatsDto getDashboardStats() {
        AdminStatsDto stats = new AdminStatsDto();
        
        try {
            // Basic counts
            stats.setTotalUsers(userRepository.count());
            stats.setTotalClients(clientRepository.count());
            stats.setActiveSessions(sessionRepository.countActiveSessions(LocalDateTime.now()));
            stats.setTotalAuditLogs(auditLogRepository.count());
            stats.setActiveRateLimits(rateLimitRepository.count());
            
            // Users by client
            Map<String, Long> usersByClient = new HashMap<>();
            List<Object[]> userClientCounts = userRepository.countUsersByClient();
            for (Object[] row : userClientCounts) {
                usersByClient.put((String) row[0], (Long) row[1]);
            }
            stats.setUsersByClient(usersByClient);
            
            // Recent activity (last 7 days)
            LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
            Map<String, Long> loginsByDay = getEventCountsByDay("LOGIN_SUCCESS", weekAgo);
            Map<String, Long> signupsByDay = getEventCountsByDay("SIGNUP_SUCCESS", weekAgo);
            stats.setLoginsByDay(loginsByDay);
            stats.setSignupsByDay(signupsByDay);
            
            // Audit event types distribution
            Map<String, Long> eventTypes = new HashMap<>();
            List<Object[]> eventCounts = auditLogRepository.countEventTypesSince(weekAgo);
            for (Object[] row : eventCounts) {
                eventTypes.put((String) row[0], (Long) row[1]);
            }
            stats.setAuditEventTypes(eventTypes);
            
            System.out.println("📊 Generated admin dashboard stats: " + 
                             stats.getTotalUsers() + " users, " + 
                             stats.getTotalClients() + " clients, " + 
                             stats.getActiveSessions() + " active sessions");
            
        } catch (Exception e) {
            System.err.println("❌ Error generating admin stats: " + e.getMessage());
        }
        
        return stats;
    }
    
    /**
     * Get paginated list of users with admin information
     */
    public Page<AdminUserDto> getUsers(int page, int size, String sortBy, String clientId) {
        // Use 'id' for sorting if createdAt is requested (since User entity doesn't have createdAt)
        if ("createdAt".equals(sortBy)) {
            sortBy = "id";
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        
        Page<User> users;
        if (clientId != null && !clientId.trim().isEmpty()) {
            users = userRepository.findByClientId(clientId, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        
        return users.map(this::convertToAdminUserDto);
    }
    
    /**
     * Get paginated audit logs
     */
    public Page<AuditLog> getAuditLogs(int page, int size, String eventType, String clientId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        
        if (eventType != null && !eventType.trim().isEmpty() && 
            clientId != null && !clientId.trim().isEmpty()) {
            return auditLogRepository.findByEventTypeAndClientId(eventType, clientId, pageable);
        } else if (eventType != null && !eventType.trim().isEmpty()) {
            return auditLogRepository.findByEventType(eventType, pageable);
        } else if (clientId != null && !clientId.trim().isEmpty()) {
            return auditLogRepository.findByClientId(clientId, pageable);
        } else {
            return auditLogRepository.findAll(pageable);
        }
    }
    
    /**
     * Get paginated list of clients
     */
    public Page<Client> getClients(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return clientRepository.findAll(pageable);
    }
    
    /**
     * Get user details by ID
     */
    public Optional<AdminUserDto> getUserById(Long userId) {
        return userRepository.findById(userId).map(this::convertToAdminUserDto);
    }
    
    /**
     * Get active sessions for a user
     */
    public List<Session> getUserSessions(Long userId) {
        return sessionService.getActiveUserSessions(userId);
    }
    
    /**
     * Deactivate all sessions for a user
     */
    public void deactivateUserSessions(Long userId) {
        sessionService.deactivateAllUserSessions(userId);
        System.out.println("🔒 Admin deactivated all sessions for user: " + userId);
    }
    
    /**
     * Get client details by ID
     */
    public Optional<Client> getClientById(String clientId) {
        return clientRepository.findByClientId(clientId);
    }
    
    /**
     * Update client settings
     */
    public Client updateClient(String clientId, String description, Integer idleTimeoutMinutes) {
        Optional<Client> clientOpt = clientRepository.findByClientId(clientId);
        if (clientOpt.isPresent()) {
            Client client = clientOpt.get();
            if (description != null) {
                client.setDescription(description);
            }
            if (idleTimeoutMinutes != null) {
                client.setIdleTimeOut(idleTimeoutMinutes); // Correct field name
            }
            // Note: Client entity doesn't have updatedAt field
            
            Client saved = clientRepository.save(client);
            System.out.println("📝 Admin updated client: " + clientId);
            return saved;
        }
        throw new RuntimeException("Client not found: " + clientId);
    }
    
    /**
     * Search users by email or name
     */
    public List<AdminUserDto> searchUsers(String searchTerm, int limit) {
        List<User> users = userRepository.searchByEmailOrName(searchTerm, PageRequest.of(0, limit));
        return users.stream().map(this::convertToAdminUserDto).collect(Collectors.toList());
    }
    
    /**
     * Get system health information
     */
    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime hourAgo = now.minusHours(1);
            
            // Recent activity
            long recentLogins = auditLogRepository.countByEventTypeAndTimestampAfter("LOGIN_SUCCESS", hourAgo);
            long recentSignups = auditLogRepository.countByEventTypeAndTimestampAfter("SIGNUP_SUCCESS", hourAgo);
            long recentErrors = auditLogRepository.countByEventTypeContainingAndTimestampAfter("FAILURE", hourAgo);
            
            health.put("recentLogins", recentLogins);
            health.put("recentSignups", recentSignups);
            health.put("recentErrors", recentErrors);
            health.put("lastChecked", now);
            health.put("status", recentErrors > 10 ? "WARNING" : "HEALTHY");
            
        } catch (Exception e) {
            health.put("status", "ERROR");
            health.put("error", e.getMessage());
        }
        
        return health;
    }
    
    /**
     * Convert User entity to AdminUserDto
     */
    private AdminUserDto convertToAdminUserDto(User user) {
        AdminUserDto dto = new AdminUserDto(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getClientId(),
            LocalDateTime.now(), // User entity doesn't have createdAt field
            LocalDateTime.now()  // User entity doesn't have updatedAt field
        );
        
        // Count active sessions - handle if no sessions exist
        try {
            int activeSessions = sessionService.getActiveUserSessions(user.getId()).size();
            dto.setActiveSessions(activeSessions);
        } catch (Exception e) {
            dto.setActiveSessions(0);
        }
        
        return dto;
    }
    
    /**
     * Get event counts by day for the specified period
     */
    private Map<String, Long> getEventCountsByDay(String eventType, LocalDateTime since) {
        Map<String, Long> eventsByDay = new HashMap<>();
        try {
            List<Object[]> dailyCounts = auditLogRepository.countEventsByDay(eventType, since);
            for (Object[] row : dailyCounts) {
                String day = row[0].toString();
                Long count = (Long) row[1];
                eventsByDay.put(day, count);
            }
        } catch (Exception e) {
            System.err.println("Error getting events by day: " + e.getMessage());
        }
        return eventsByDay;
    }
}