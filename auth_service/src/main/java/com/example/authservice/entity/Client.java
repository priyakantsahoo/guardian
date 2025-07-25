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
@Table(name = "clients")
@Data
public class Client {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", unique = true)
    private String clientId;

    // @Column(name = "client_key")
    private String clientKey;

    private String name;
    
    private String description;

    private int idleTimeOut;

    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
}
