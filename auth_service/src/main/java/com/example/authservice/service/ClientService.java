package com.example.authservice.service;

import com.example.authservice.entity.Client;
import com.example.authservice.repository.ClientRepository;
import com.example.authservice.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final ConcurrentHashMap<String, String> clientKeyCache = new ConcurrentHashMap<>();
    
    @Autowired
    private AuditLogService auditLogService;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public Client createClient(String name, String description, int idleTimeoutMinutes, HttpServletRequest request) {
        Client client = new Client();
        client.setClientId(generateClientId());
        client.setClientKey(generateClientKey());
        client.setName(name);
        client.setDescription(description);
        client.setIdleTimeOut(idleTimeoutMinutes * 60);
        client.setCreatedAt(LocalDateTime.now());
        clientRepository.save(client);
        clientKeyCache.put(client.getClientId(), client.getClientKey());
        
        // Log client creation event with full request context
        try {
            auditLogService.logEvent(
                "CLIENT_REGISTRATION",
                null, // No user email for client registration
                client.getClientId(),
                request, // Pass the HTTP request for forensic data
                201,
                null
            );
        } catch (Exception e) {
            System.err.println("Failed to log client creation: " + e.getMessage());
        }
        
        return client;
    }
    
    // Backward compatibility method
    public Client createClient(String name, String description, int idleTimeoutMinutes) {
        return createClient(name, description, idleTimeoutMinutes, null);
    }
    
    // Backward compatibility method
    public Client createClient(String name, int idleTimeoutMinutes) {
        return createClient(name, null, idleTimeoutMinutes);
    }

    public boolean validateClientKey(String clientId, String clientKey) {
    String cachedKey = clientKeyCache.get(clientId);

        System.out.println("ClientID "+clientId);

    if (cachedKey == null) {
        Client client = clientRepository.findByClientId(clientId).orElse(null);
        if (client == null) {
            return false;
        }
        cachedKey = client.getClientKey();
        clientKeyCache.put(clientId, cachedKey);
    }

    return cachedKey.equals(clientKey);
}


    private String generateClientId() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder clientId = new StringBuilder(6);
        
        for (int i = 0; i < 6; i++) {
            clientId.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return clientId.toString();
    }

    /**
     * Generates a cryptographically secure client key using Base64 encoding.
     * 
     * Key Specifications:
     * - 32 bytes (256 bits) of secure random data
     * - URL-safe Base64 encoding without padding
     * - Approximately 43 characters in length
     * - Suitable for API authentication
     * 
     * @return A secure Base64-encoded client key
     */
    private String generateClientKey() {
        byte[] bytes = new byte[32]; // 256 bits of entropy
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Rotates the client key for enhanced security.
     * Generates a new secure key and updates the client record.
     * 
     * @param clientId The client ID to rotate the key for
     * @return The new client key, or null if client not found
     */
    public String rotateClientKey(String clientId) {
        Client client = clientRepository.findByClientId(clientId).orElse(null);
        if (client == null) {
            // Log failed key rotation attempt
            try {
                auditLogService.logEvent(
                    "CLIENT_KEY_ROTATION_FAILED",
                    null,
                    clientId,
                    null, // No HTTP request available
                    404,
                    "CLIENT_NOT_FOUND"
                );
            } catch (Exception e) {
                System.err.println("Failed to log key rotation failure: " + e.getMessage());
            }
            return null;
        }
        
        String oldKeyPreview = client.getClientKey().substring(0, 8) + "...";
        String newKey = generateClientKey();
        client.setClientKey(newKey);
        client.setUpdatedAt(LocalDateTime.now());
        clientRepository.save(client);
        
        // Update cache
        clientKeyCache.put(clientId, newKey);
        
        // Log successful key rotation
        try {
            auditLogService.logEvent(
                "CLIENT_KEY_ROTATION_SUCCESS",
                null,
                clientId,
                null, // No HTTP request available
                200,
                null
            );
        } catch (Exception e) {
            System.err.println("Failed to log key rotation success: " + e.getMessage());
        }
        
        return newKey;
    }
}
