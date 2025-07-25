package com.example.authservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.authservice.service.AuthService;
import com.example.authservice.service.SessionService;
import com.example.authservice.service.JwtService;
import com.example.authservice.service.RateLimitService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private SessionService sessionService;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private RateLimitService rateLimitService;

    @PostMapping("/signup")
    public ResponseEntity<String> signup(
            @RequestBody AuthRequest request,
            @RequestHeader(name = "X-Client-Id", required = false) String clientId,
            @RequestHeader(name = "X-Client-Key", required = false) String clientKey,
            HttpServletRequest httpServletRequest) {
        System.out.println(">> Entered signup! headers id=" + clientId + " key=" + clientKey + ", body=" + request.getEmail()+","+request.getPassword());
        
        if (clientId == null || clientKey == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Missing X-Client-Id or X-Client-Key header");
        }
        
        // Check rate limit
        RateLimitService.RateLimitResult rateLimitResult = rateLimitService.checkRateLimit(
            httpServletRequest, clientId, RateLimitService.SIGNUP_OPERATION);
        
        if (!rateLimitResult.isAllowed()) {
            return ResponseEntity
                    .status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(rateLimitResult.getRemainingTimeSeconds()))
                    .body(rateLimitResult.getMessage());
        }

        String token = authService.signup(
                request.getEmail(),
                request.getPassword(),
                request.getFirstName(),
                request.getLastName(),
                clientId,
                clientKey,
                httpServletRequest);
        System.out.println("Token: "+token);
        
        // Record failed attempt for rate limiting if signup failed
        if (token == null) {
            rateLimitService.recordFailedAttempt(httpServletRequest, clientId, RateLimitService.SIGNUP_OPERATION);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signup failed");
        }
        
        return ResponseEntity.ok(token);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(
            @RequestBody AuthRequest request,
            @RequestHeader(name = "X-Client-Id", required = false) String clientId,
            @RequestHeader(name = "X-Client-Key", required = false) String clientKey,
            HttpServletRequest httpServletRequest) {
        System.out.println(">> Entered login! headers id=" + clientId + " key=" + clientKey + ", body=" + request.getEmail());
        
        if (clientId == null || clientKey == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Missing X-Client-Id or X-Client-Key header");
        }
        
        // Check rate limit
        RateLimitService.RateLimitResult rateLimitResult = rateLimitService.checkRateLimit(
            httpServletRequest, clientId, RateLimitService.LOGIN_OPERATION);
        
        if (!rateLimitResult.isAllowed()) {
            return ResponseEntity
                    .status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(rateLimitResult.getRemainingTimeSeconds()))
                    .body(rateLimitResult.getMessage());
        }

        String token = authService.login(
                request.getEmail(),
                request.getPassword(),
                clientId,
                clientKey,
                httpServletRequest);
                
        if (token != null) {
            System.out.println("Login successful, returning token");
            return ResponseEntity.ok(token);
        } else {
            System.out.println("Login failed");
            // Record failed attempt for rate limiting
            rateLimitService.recordFailedAttempt(httpServletRequest, clientId, RateLimitService.LOGIN_OPERATION);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }
    
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(
            @RequestBody TokenValidationRequest request,
            @RequestHeader(name = "X-Client-Id", required = false) String clientId,
            @RequestHeader(name = "X-Client-Key", required = false) String clientKey,
            HttpServletRequest httpServletRequest) {
        
        System.out.println(">> Token validation request for client: " + clientId);
        
        if (clientId == null || clientKey == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Missing X-Client-Id or X-Client-Key header");
        }
        
        // Check rate limit for token validation
        RateLimitService.RateLimitResult rateLimitResult = rateLimitService.checkRateLimit(
            httpServletRequest, clientId, RateLimitService.TOKEN_VALIDATION_OPERATION);
        
        if (!rateLimitResult.isAllowed()) {
            return ResponseEntity
                    .status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(rateLimitResult.getRemainingTimeSeconds()))
                    .body(rateLimitResult.getMessage());
        }
        
        String token = request.getToken();
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Token is required");
        }
        
        // Validate JWT structure and signature
        if (jwtService.validateToken(token) == null) {
            System.out.println("❌ Invalid JWT token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        
        // Extract session ID from token
        String sessionId = jwtService.getSessionIdFromToken(token);
        if (sessionId == null) {
            System.out.println("❌ No session ID in token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token format");
        }
        
        // Validate session (includes idle timeout check)
        if (!sessionService.validateSession(sessionId, clientId)) {
            System.out.println("❌ Session validation failed");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expired or invalid");
        }
        
        // Return session and user information
        String userId = jwtService.getUserIdFromToken(token);
        TokenValidationResponse response = new TokenValidationResponse();
        response.setValid(true);
        response.setUserId(Long.parseLong(userId));
        response.setClientId(clientId);
        response.setSessionId(sessionId);
        
        System.out.println("✅ Token validation successful for user: " + userId);
        return ResponseEntity.ok(response);
    }
}

class AuthRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;

    // Getters & Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
}

class TokenValidationRequest {
    private String token;
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
}

class TokenValidationResponse {
    private boolean valid;
    private Long userId;
    private String clientId;
    private String sessionId;
    
    public boolean isValid() {
        return valid;
    }
    
    public void setValid(boolean valid) {
        this.valid = valid;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getClientId() {
        return clientId;
    }
    
    public void setClientId(String clientId) {
        this.clientId = clientId;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
