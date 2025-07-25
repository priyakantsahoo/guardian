package com.example.authservice.service;

import jakarta.servlet.ServletOutputStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.authservice.entity.User;
import com.example.authservice.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClientService clientService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private SessionService sessionService;

    private final BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();

    public String signup(String email, String password, String firstName, String lastName, String clientId, String clientKey, HttpServletRequest request) {
        System.out.println(email);
        System.out.println(password);
        System.out.println(clientId);
        System.out.println(clientKey);
        System.out.println(request);
        if (!clientService.validateClientKey(clientId, clientKey)) {
            System.out.println("❌ Invalid client credentials");
            auditLogService.logEvent("SIGNUP_FAILURE", email, clientId, request, 401, "INVALID_CLIENT_KEY");
            return null; // <--- Add this to stop execution if client key invalid
        }

        if (userRepository.findByEmailAndClientId(email, clientId).isPresent()) {
            System.out.println("❌ Email already exists for this client");
            auditLogService.logEvent("SIGNUP_FAILURE", email, clientId, request, 400, "EMAIL_EXISTS");
            return null;
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(bCryptPasswordEncoder.encode(password)); // <--- Hash the password here
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setClientId(clientId);
        User savedUser = userRepository.save(user);

        // Create session
        com.example.authservice.entity.Session session = sessionService.createSession(savedUser.getId(), clientId, request);
        
        // Generate JWT token with session ID
        String token = jwtService.generateTokenWithSessionId(savedUser.getId(), clientId, session.getSessionId());
        
        auditLogService.logEvent("SIGNUP_SUCCESS", email, clientId, request, 200, null);

        System.out.println("✅ Generated token with session: " + token);

        return token;
    }

    public String login(String email, String password, String clientId, String clientKey, HttpServletRequest request) {
        System.out.println("🔐 Login attempt: " + email + " for client: " + clientId);
        
        // Validate client credentials
        if (!clientService.validateClientKey(clientId, clientKey)) {
            System.out.println("❌ Invalid client credentials");
            auditLogService.logEvent("LOGIN_FAILURE", email, clientId, request, 401, "INVALID_CLIENT_KEY");
            return null;
        }

        // Find user by email and client ID
        User user = userRepository.findByEmailAndClientId(email, clientId).orElse(null);
        if (user == null) {
            System.out.println("❌ User not found: " + email + " for client: " + clientId);
            auditLogService.logEvent("LOGIN_FAILURE", email, clientId, request, 404, "USER_NOT_FOUND");
            return null;
        }

        // Verify password
        if (!bCryptPasswordEncoder.matches(password, user.getPasswordHash())) {
            System.out.println("❌ Invalid password for user: " + email);
            auditLogService.logEvent("LOGIN_FAILURE", email, clientId, request, 401, "INVALID_PASSWORD");
            return null;
        }

        // Create session
        com.example.authservice.entity.Session session = sessionService.createSession(user.getId(), clientId, request);
        
        // Generate JWT token with session ID
        String token = jwtService.generateTokenWithSessionId(user.getId(), clientId, session.getSessionId());
        System.out.println("✅ Login successful, generated token with session: " + token);
        
        auditLogService.logEvent("LOGIN_SUCCESS", email, clientId, request, 200, null);
        
        return token;
    }

}
