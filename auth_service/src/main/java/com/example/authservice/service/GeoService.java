package com.example.authservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.util.HashMap;
import java.util.Map;

/**
 * GeoService for IP geolocation
 * Uses MaxMind GeoLite2 database when available, falls back to simple mapping
 */
@Service
public class GeoService {
    
    @Autowired(required = false)
    private GeoLite2Service geoLite2Service;
    
    // Simple IP to country mapping for demo/testing purposes
    // In production, this would use MaxMind GeoLite2 database
    private static final Map<String, GeoLocation> IP_MAPPINGS = new HashMap<>();
    
    static {
        // Add some common IP ranges for testing
        IP_MAPPINGS.put("127.0.0.1", new GeoLocation("United States", "Local"));
        IP_MAPPINGS.put("::1", new GeoLocation("United States", "Local"));
        IP_MAPPINGS.put("0:0:0:0:0:0:0:1", new GeoLocation("United States", "Local"));
        
        // Add some example mappings
        IP_MAPPINGS.put("8.8.8.8", new GeoLocation("United States", "Mountain View"));
        IP_MAPPINGS.put("1.1.1.1", new GeoLocation("United States", "San Francisco"));
        IP_MAPPINGS.put("208.67.222.222", new GeoLocation("United States", "San Francisco"));
    }
    
    /**
     * Get geolocation information for an IP address
     */
    public GeoLocation getGeoLocation(String ipAddress) {
        if (ipAddress == null || ipAddress.trim().isEmpty()) {
            return new GeoLocation("Unknown", "Unknown");
        }
        
        try {
            // Normalize IP address
            String normalizedIp = normalizeIpAddress(ipAddress);
            
            // Check if it's a localhost/private IP
            if (isLocalhost(normalizedIp) || isPrivateIp(normalizedIp)) {
                return new GeoLocation("Local", "Local");
            }
            
            // Try exact match first
            GeoLocation location = IP_MAPPINGS.get(normalizedIp);
            if (location != null) {
                return location;
            }
            
            // Try MaxMind GeoLite2 database if available
            if (geoLite2Service != null && geoLite2Service.isDatabaseAvailable()) {
                GeoLocation dbLocation = geoLite2Service.getGeoLocationFromDatabase(normalizedIp);
                if (dbLocation != null) {
                    return dbLocation;
                }
            }
            
            // Fallback to default location for unknown IPs
            return getDefaultGeoLocation(normalizedIp);
            
        } catch (Exception e) {
            System.err.println("Error determining geolocation for IP: " + ipAddress + " - " + e.getMessage());
            return new GeoLocation("Unknown", "Unknown");
        }
    }
    
    /**
     * Normalize IP address (handle IPv6, proxied IPs, etc.)
     */
    private String normalizeIpAddress(String ipAddress) {
        // Handle X-Forwarded-For header (comma-separated IPs)
        if (ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        
        // Handle IPv6 localhost
        if ("0:0:0:0:0:0:0:1".equals(ipAddress) || "::1".equals(ipAddress)) {
            return "127.0.0.1";
        }
        
        return ipAddress.trim();
    }
    
    /**
     * Check if IP is localhost
     */
    private boolean isLocalhost(String ipAddress) {
        return "127.0.0.1".equals(ipAddress) || 
               "::1".equals(ipAddress) || 
               "localhost".equals(ipAddress);
    }
    
    /**
     * Check if IP is in private range
     */
    private boolean isPrivateIp(String ipAddress) {
        try {
            InetAddress inetAddress = InetAddress.getByName(ipAddress);
            return inetAddress.isSiteLocalAddress() || inetAddress.isLoopbackAddress();
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Get default geolocation for unknown IPs
     */
    private GeoLocation getDefaultGeoLocation(String ipAddress) {
        // Simple heuristic: try to determine region based on IP pattern
        if (ipAddress.startsWith("192.168.") || 
            ipAddress.startsWith("10.") || 
            ipAddress.startsWith("172.")) {
            return new GeoLocation("Private", "Private Network");
        }
        
        // For unknown public IPs, return generic location
        return new GeoLocation("Unknown", "Unknown");
    }
    
    /**
     * Inner class to hold geolocation data
     */
    public static class GeoLocation {
        private final String country;
        private final String city;
        
        public GeoLocation(String country, String city) {
            this.country = country != null ? country : "Unknown";
            this.city = city != null ? city : "Unknown";
        }
        
        public String getCountry() {
            return country;
        }
        
        public String getCity() {
            return city;
        }
        
        @Override
        public String toString() {
            return city + ", " + country;
        }
    }
    
    /**
     * Test method to verify geolocation service
     */
    public void testGeoService() {
        String[] testIps = {"127.0.0.1", "8.8.8.8", "1.1.1.1", "192.168.1.1", "10.0.0.1"};
        
        System.out.println("🌍 GeoService Test Results:");
        for (String ip : testIps) {
            GeoLocation location = getGeoLocation(ip);
            System.out.println("  " + ip + " -> " + location);
        }
    }
}