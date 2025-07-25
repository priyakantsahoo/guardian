package com.example.authservice.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.authservice.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long>{
    Page<AuditLog> findByClientIdAndEventType(String clientId, String eventType, Pageable pageable);
    
    Page<AuditLog> findByUserEmail(String userEmail, Pageable pageable);
    
    // Admin queries
    Page<AuditLog> findByEventType(String eventType, Pageable pageable);
    
    Page<AuditLog> findByClientId(String clientId, Pageable pageable);
    
    Page<AuditLog> findByEventTypeAndClientId(String eventType, String clientId, Pageable pageable);
    
    // Statistics queries
    @Query("SELECT a.eventType, COUNT(a) FROM AuditLog a WHERE a.timestamp >= :since GROUP BY a.eventType")
    List<Object[]> countEventTypesSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT DATE(a.timestamp), COUNT(a) FROM AuditLog a WHERE a.eventType = :eventType AND a.timestamp >= :since GROUP BY DATE(a.timestamp)")
    List<Object[]> countEventsByDay(@Param("eventType") String eventType, @Param("since") LocalDateTime since);
    
    long countByEventTypeAndTimestampAfter(String eventType, LocalDateTime timestamp);
    
    long countByEventTypeContainingAndTimestampAfter(String eventType, LocalDateTime timestamp);
}
