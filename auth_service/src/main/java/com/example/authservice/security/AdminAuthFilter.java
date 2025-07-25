package com.example.authservice.security;

import com.example.authservice.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Filter for admin authentication using JWT tokens
 * Validates JWT tokens for admin endpoints
 */
@Component
public class AdminAuthFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtService jwtService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Only apply to admin endpoints
        if (requestPath.startsWith("/api/admin/")) {
            // Extract JWT token from Authorization header
            String authHeader = request.getHeader("Authorization");
            String token = null;
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            if (token != null) {
                try {
                    // Validate JWT token and get user ID
                    String userId = jwtService.getUserIdFromToken(token);
                    
                    if (userId != null) {
                        // Create authenticated context - any valid JWT user can access admin endpoints
                        // since we're only doing authentication, not authorization
                        UsernamePasswordAuthenticationToken authToken = 
                            new UsernamePasswordAuthenticationToken(
                                userId, 
                                null, 
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            );
                        
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        System.out.println("✅ JWT authenticated for admin endpoint: " + requestPath + " (user: " + userId + ")");
                    } else {
                        System.out.println("❌ Invalid JWT token for: " + requestPath);
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.getWriter().write("{\"error\":\"Invalid or expired token\"}");
                        response.setContentType("application/json");
                        return;
                    }
                } catch (Exception e) {
                    System.out.println("❌ JWT validation error for: " + requestPath + " - " + e.getMessage());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"error\":\"Invalid token\"}");
                    response.setContentType("application/json");
                    return;
                }
            } else {
                System.out.println("❌ Missing JWT token for: " + requestPath);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"JWT authentication required\"}");
                response.setContentType("application/json");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}