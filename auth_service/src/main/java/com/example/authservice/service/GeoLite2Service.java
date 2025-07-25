package com.example.authservice.service;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.exception.GeoIp2Exception;
import com.maxmind.geoip2.model.CityResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.File;
import java.io.IOException;
import java.net.InetAddress;

/**
 * Enhanced GeoService implementation using MaxMind GeoLite2 database
 * Falls back to basic implementation when database is not available
 */
@Service
public class GeoLite2Service {
    
    @Value("${geolite2.database.path:#{null}}")
    private String databasePath;
    
    private DatabaseReader cityReader;
    private boolean databaseAvailable = false;
    
    @PostConstruct
    public void init() {
        if (databasePath != null && !databasePath.isEmpty()) {
            try {
                File database = new File(databasePath);
                if (database.exists()) {
                    cityReader = new DatabaseReader.Builder(database).build();
                    databaseAvailable = true;
                    System.out.println("✅ GeoLite2 database loaded from: " + databasePath);
                } else {
                    System.out.println("⚠️ GeoLite2 database file not found at: " + databasePath);
                    System.out.println("   Download from: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data");
                }
            } catch (IOException e) {
                System.err.println("❌ Failed to load GeoLite2 database: " + e.getMessage());
            }
        } else {
            System.out.println("ℹ️ GeoLite2 database path not configured. Using fallback geolocation.");
            System.out.println("   Set geolite2.database.path in application.properties to enable.");
        }
    }
    
    @PreDestroy
    public void cleanup() {
        if (cityReader != null) {
            try {
                cityReader.close();
            } catch (IOException e) {
                System.err.println("Error closing GeoLite2 database: " + e.getMessage());
            }
        }
    }
    
    /**
     * Get geolocation using MaxMind GeoLite2 database
     */
    public GeoService.GeoLocation getGeoLocationFromDatabase(String ipAddress) {
        if (!databaseAvailable || cityReader == null) {
            return null;
        }
        
        try {
            InetAddress inetAddress = InetAddress.getByName(ipAddress);
            CityResponse response = cityReader.city(inetAddress);
            
            String country = response.getCountry().getName();
            String city = response.getCity().getName();
            
            // Fallback to subdivision (state/region) if city is not available
            if (city == null && response.getMostSpecificSubdivision() != null) {
                city = response.getMostSpecificSubdivision().getName();
            }
            
            // Fallback to "Unknown City" if still null
            if (city == null) {
                city = "Unknown City";
            }
            
            return new GeoService.GeoLocation(country, city);
            
        } catch (IOException | GeoIp2Exception e) {
            // Database doesn't have info for this IP, or IP is invalid
            return null;
        }
    }
    
    /**
     * Check if GeoLite2 database is available
     */
    public boolean isDatabaseAvailable() {
        return databaseAvailable;
    }
    
    /**
     * Get database status information
     */
    public String getDatabaseStatus() {
        if (databaseAvailable) {
            return "GeoLite2 database is loaded and operational";
        } else if (databasePath != null && !databasePath.isEmpty()) {
            return "GeoLite2 database path configured but file not found: " + databasePath;
        } else {
            return "GeoLite2 database not configured";
        }
    }
}