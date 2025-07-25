package com.example.authservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.authservice.entity.Client;

public interface ClientRepository extends JpaRepository<Client, Long>{
    Optional<Client> findByClientId(String clientId);
}
