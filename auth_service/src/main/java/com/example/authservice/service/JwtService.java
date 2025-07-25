package com.example.authservice.service;

import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    public String generateToken(Long userId, String clientId) {
        String jti = UUID.randomUUID().toString();
        return generateTokenWithSessionId(userId, clientId, jti);
    }
    
    public String generateTokenWithSessionId(Long userId, String clientId, String sessionId) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("clientId", clientId)
                .setId(sessionId) // jti claim - session ID
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }

    public Claims validateToken(String token) {
        try {
            return Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
        } catch (Exception e) {
            return null;
        }
    }
    
    public String getSessionIdFromToken(String token) {
        Claims claims = validateToken(token);
        return claims != null ? claims.getId() : null; // jti claim
    }
    
    public String getUserIdFromToken(String token) {
        Claims claims = validateToken(token);
        return claims != null ? claims.getSubject() : null;
    }
    
    public String getClientIdFromToken(String token) {
        Claims claims = validateToken(token);
        return claims != null ? (String) claims.get("clientId") : null;
    }
    
    public boolean isTokenExpired(String token) {
        Claims claims = validateToken(token);
        if (claims == null) return true;
        return claims.getExpiration().before(new Date());
    }
}
