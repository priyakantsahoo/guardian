package com.example.authservice.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "audit_logs")
@Data
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String eventType;

    private String userEmail;

    @Column(name = "client_id")
    private String clientId;

    private String ipAddress;

    private LocalDateTime timestamp = LocalDateTime.now();

    private String details;

    private String userAgent;

    private String requestMethod;

    private String endpoint;
    
    private String sessionId;
    
    private Integer responseStatus;
    
    private String geoCountry;
    
    private String geoCity;
    
    private String requestId;
    
    private String errorCode;

}
