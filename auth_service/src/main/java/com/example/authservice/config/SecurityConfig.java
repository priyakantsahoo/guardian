package com.example.authservice.config;

import com.example.authservice.security.ApiKeyAuthFilter;
import com.example.authservice.security.JwtAuthFilter;
import com.example.authservice.service.ClientService;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.*;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public ApiKeyAuthFilter apiKeyAuthFilter(ClientService clientService) {
        // Create the filter with dependency injection
        return new ApiKeyAuthFilter(clientService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ApiKeyAuthFilter apiKeyAuthFilter, JwtAuthFilter jwtAuthFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/clients/register",
                    "/api/auth/signup", 
                    "/api/auth/login",
                    "/api/auth/validate",
                    "/actuator/**",
                    "/h2-console/**",
                    "/error"
                ).permitAll()
                // Admin endpoints require admin role
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/auth/admin/**").hasRole("ADMIN")
                // All other API endpoints require client authentication
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            // Add filters in correct order: JWT auth for admin endpoints, then API key auth
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(apiKeyAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
