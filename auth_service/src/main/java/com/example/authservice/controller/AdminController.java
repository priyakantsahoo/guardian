package com.example.authservice.controller;

import com.example.authservice.dto.AdminStatsDto;
import com.example.authservice.dto.AdminUserDto;
import com.example.authservice.entity.AuditLog;
import com.example.authservice.entity.Client;
import com.example.authservice.entity.Session;
import com.example.authservice.service.AdminService;
import com.example.authservice.service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Admin REST Controller for managing users, clients, and system monitoring
 * All endpoints require admin authentication
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private ClientService clientService;
    
    /**
     * Get dashboard statistics
     * GET /api/admin/stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsDto> getDashboardStats() {
        try {
            AdminStatsDto stats = adminService.getDashboardStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("❌ Error getting admin stats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get system health information
     * GET /api/admin/health
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        try {
            Map<String, Object> health = adminService.getSystemHealth();
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            System.err.println("❌ Error getting system health: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get paginated list of users
     * GET /api/admin/users?page=0&size=20&sortBy=createdAt&clientId=ABC123
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AdminUserDto>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false) String clientId) {
        try {
            Page<AdminUserDto> users = adminService.getUsers(page, size, sortBy, clientId);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("❌ Error getting users: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get user details by ID
     * GET /api/admin/users/{userId}
     */
    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDto> getUserById(@PathVariable Long userId) {
        try {
            Optional<AdminUserDto> user = adminService.getUserById(userId);
            return user.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("❌ Error getting user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get active sessions for a user
     * GET /api/admin/users/{userId}/sessions
     */
    @GetMapping("/users/{userId}/sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Session>> getUserSessions(@PathVariable Long userId) {
        try {
            List<Session> sessions = adminService.getUserSessions(userId);
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            System.err.println("❌ Error getting sessions for user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Deactivate all sessions for a user
     * DELETE /api/admin/users/{userId}/sessions
     */
    @DeleteMapping("/users/{userId}/sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deactivateUserSessions(@PathVariable Long userId) {
        try {
            adminService.deactivateUserSessions(userId);
            return ResponseEntity.ok("All sessions deactivated for user " + userId);
        } catch (Exception e) {
            System.err.println("❌ Error deactivating sessions for user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Failed to deactivate sessions");
        }
    }
    
    /**
     * Search users by email or name
     * GET /api/admin/users/search?q=john&limit=10
     */
    @GetMapping("/users/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminUserDto>> searchUsers(
            @RequestParam("q") String searchTerm,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<AdminUserDto> users = adminService.searchUsers(searchTerm, limit);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("❌ Error searching users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get paginated list of clients
     * GET /api/admin/clients?page=0&size=20
     */
    @GetMapping("/clients")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Client>> getClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<Client> clients = adminService.getClients(page, size);
            return ResponseEntity.ok(clients);
        } catch (Exception e) {
            System.err.println("❌ Error getting clients: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get client details by ID
     * GET /api/admin/clients/{clientId}
     */
    @GetMapping("/clients/{clientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Client> getClientById(@PathVariable String clientId) {
        try {
            Optional<Client> client = adminService.getClientById(clientId);
            return client.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("❌ Error getting client " + clientId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Update client settings
     * PUT /api/admin/clients/{clientId}
     */
    @PutMapping("/clients/{clientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Client> updateClient(
            @PathVariable String clientId,
            @RequestBody ClientUpdateRequest request) {
        try {
            Client updatedClient = adminService.updateClient(
                clientId, 
                request.getDescription(), 
                request.getIdleTimeoutMinutes()
            );
            return ResponseEntity.ok(updatedClient);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("❌ Error updating client " + clientId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Rotate client key for enhanced security
     * POST /api/admin/clients/{clientId}/rotate-key
     */
    @PostMapping("/clients/{clientId}/rotate-key")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> rotateClientKey(@PathVariable String clientId) {
        try {
            String newKey = clientService.rotateClientKey(clientId);
            if (newKey == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(Map.of(
                "clientId", clientId,
                "newClientKey", newKey,
                "message", "Client key rotated successfully",
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            System.err.println("❌ Error rotating key for client " + clientId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "Failed to rotate client key"));
        }
    }
    
    /**
     * Get paginated audit logs
     * GET /api/admin/logs?page=0&size=50&eventType=LOGIN_SUCCESS&clientId=ABC123
     */
    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String clientId) {
        try {
            Page<AuditLog> logs = adminService.getAuditLogs(page, size, eventType, clientId);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            System.err.println("❌ Error getting audit logs: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Request DTO for client updates
     */
    public static class ClientUpdateRequest {
        private String description;
        private Integer idleTimeoutMinutes;
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public Integer getIdleTimeoutMinutes() { return idleTimeoutMinutes; }
        public void setIdleTimeoutMinutes(Integer idleTimeoutMinutes) { this.idleTimeoutMinutes = idleTimeoutMinutes; }
    }
}