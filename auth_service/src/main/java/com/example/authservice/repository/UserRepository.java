package com.example.authservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.authservice.entity.User;

public interface UserRepository extends JpaRepository<User, Long>{
    Optional<User> findByEmailAndClientId(String email, String clientId);
    
    // Admin queries
    Page<User> findByClientId(String clientId, Pageable pageable);
    
    @Query("SELECT u.clientId, COUNT(u) FROM User u GROUP BY u.clientId")
    List<Object[]> countUsersByClient();
    
    @Query("SELECT u FROM User u WHERE u.email LIKE %:searchTerm% OR u.firstName LIKE %:searchTerm% OR u.lastName LIKE %:searchTerm%")
    List<User> searchByEmailOrName(@Param("searchTerm") String searchTerm, Pageable pageable);
}
