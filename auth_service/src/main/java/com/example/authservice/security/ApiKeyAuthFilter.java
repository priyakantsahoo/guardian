package com.example.authservice.security;

import com.example.authservice.service.ClientService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;


import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ClientService clientService;

    public ApiKeyAuthFilter(ClientService clientService) {
        this.clientService = clientService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/api/clients/register")
                || path.equals("/api/auth/signup")
                || path.equals("/api/auth/login")
                || path.equals("/api/auth/validate")
                || path.startsWith("/api/admin/") // Skip API key check for admin endpoints
                || path.startsWith("/actuator/")
                || path.startsWith("/h2-console/")
                || path.equals("/error"); // Spring Boot default error endpoint
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String clientId = req.getHeader("X-Client-Id");
        String clientKey = req.getHeader("X-Client-Key");
        
        // Check if both headers are present
        if (clientId == null || clientKey == null) {
            res.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing client credentials headers (X-Client-Id, X-Client-Key)");
            return;
        }
        
        // Validate client credentials
        if (!clientService.validateClientKey(clientId, clientKey)) {
            res.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid client credentials");
            return;
        }

        // Mark this client as authenticated
        var auth = new UsernamePasswordAuthenticationToken(clientId, clientKey, null);
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(req, res);
    }
}
