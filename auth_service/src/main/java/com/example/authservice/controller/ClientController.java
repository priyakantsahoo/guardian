package com.example.authservice.controller;


import com.example.authservice.dto.ClientServiceDTO;
import com.example.authservice.entity.Client;
import com.example.authservice.service.ClientService;



import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerClient(
             @RequestBody ClientServiceDTO req,
             HttpServletRequest request
    ) {
        String name = req.getName();
        String description = req.getDescription();
        int timeout = req.getIdleTimeoutMinutes() != null ? req.getIdleTimeoutMinutes() : 30; // Default 30 minutes

        Client client = clientService.createClient(name, description, timeout, request);
        return ResponseEntity.ok(Map.of(
                "clientId", client.getClientId(),
                "clientKey", client.getClientKey(),
                "name", client.getName(),
                "description", client.getDescription() != null ? client.getDescription() : "",
                "keyStrength", "256-bit Base64 encoded",
                "keyLength", String.valueOf(client.getClientKey().length()),
                "createdAt", client.getCreatedAt().toString(),
                "idleTimeoutMinutes", String.valueOf(client.getIdleTimeOut() / 60)
        ));
    }
}
