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
 * JWT Authentication Filter for admin endpoints
 * Validates JWT tokens and grants admin privileges to authenticated users
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtService jwtService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Only apply to admin endpoints
        if (requestPath.startsWith("/api/admin/")) {
            String authHeader = request.getHeader("Authorization");
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                
                try {
                    // Validate JWT token
                    if (jwtService.validateToken(token) != null && !jwtService.isTokenExpired(token)) {
                        String userId = jwtService.getUserIdFromToken(token);
                        String clientId = jwtService.getClientIdFromToken(token);
                        
                        // Create admin authentication for valid JWT tokens
                        UsernamePasswordAuthenticationToken adminAuth = 
                            new UsernamePasswordAuthenticationToken(
                                userId, 
                                null, 
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            );
                        
                        SecurityContextHolder.getContext().setAuthentication(adminAuth);
                        System.out.println("✅ JWT Admin authenticated for user: " + userId + " at: " + requestPath);
                    } else {
                        System.out.println("❌ Invalid JWT token for: " + requestPath);
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.getWriter().write("{\"error\":\"Invalid JWT token\"}");
                        response.setContentType("application/json");
                        return;
                    }
                } catch (Exception e) {
                    System.out.println("❌ JWT validation error for: " + requestPath + " - " + e.getMessage());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"error\":\"JWT validation failed\"}");
                    response.setContentType("application/json");
                    return;
                }
            } else {
                System.out.println("❌ Missing JWT token for: " + requestPath);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"JWT token required\"}");
                response.setContentType("application/json");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}