package com.example.authservice.dto;


import lombok.Data;

@Data
public class ClientServiceDTO {
    
    private String name;
    private String description;
    private Integer idleTimeoutMinutes;
}
