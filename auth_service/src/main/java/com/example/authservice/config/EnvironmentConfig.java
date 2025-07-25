package com.example.authservice.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuration class to load environment variables from .env file
 * This provides a secure way to manage secrets without hardcoding them
 * 
 * In production, this should be replaced with proper secrets management:
 * - AWS Secrets Manager
 * - HashiCorp Vault
 * - Kubernetes Secrets
 * - Azure Key Vault
 */
@Component
public class EnvironmentConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();
        
        try {
            // Load .env file from the application root directory
            Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();
            
            // Convert dotenv entries to a Map for Spring
            Map<String, Object> envMap = new HashMap<>();
            dotenv.entries().forEach(entry -> {
                envMap.put(entry.getKey(), entry.getValue());
            });
            
            // Add as a property source with high priority
            environment.getPropertySources().addFirst(new MapPropertySource("dotenv", envMap));
            
        } catch (Exception e) {
            // Log warning but don't fail startup - fall back to system environment variables
            System.out.println("Warning: Could not load .env file: " + e.getMessage() + ". Using system environment variables.");
        }
    }
}