-- Guardian Auth Service Database Schema
-- PostgreSQL Database: guardian

-- Create clients table (must be created first due to foreign key constraints)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL UNIQUE,
    client_key VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    idle_timeout INTEGER NOT NULL DEFAULT 1800, -- 30 minutes default
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    client_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email, client_id),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

-- Create sessions table for idle timeout management
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL,
    client_id VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    last_activity TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    user_agent VARCHAR(255),
    ip_address VARCHAR(45),
    UNIQUE (jti, client_id),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_email VARCHAR(255),
    client_id VARCHAR(50),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    user_agent VARCHAR(255),
    request_method VARCHAR(10),
    endpoint VARCHAR(100),
    session_id VARCHAR(36),
    response_status INTEGER,
    geo_country VARCHAR(50),
    geo_city VARCHAR(100),
    request_id VARCHAR(36),
    error_code VARCHAR(50),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE SET NULL
);

-- Create rate_limits table
CREATE TABLE rate_limits (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    last_attempt TIMESTAMP NOT NULL,
    reset_time TIMESTAMP NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    user_agent VARCHAR(500),
    context VARCHAR(200),
    UNIQUE (ip_address, client_id, operation_type),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_client_id ON users(client_id);

CREATE INDEX idx_sessions_jti ON sessions(jti);
CREATE INDEX idx_sessions_client_id ON sessions(client_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

CREATE INDEX idx_audit_logs_client_id ON audit_logs(client_id);
CREATE INDEX idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);

CREATE INDEX idx_rate_limits_ip_address ON rate_limits(ip_address);
CREATE INDEX idx_rate_limits_client_id ON rate_limits(client_id);
CREATE INDEX idx_rate_limits_operation_type ON rate_limits(operation_type);
CREATE INDEX idx_rate_limits_last_attempt ON rate_limits(last_attempt);
CREATE INDEX idx_rate_limits_is_blocked ON rate_limits(is_blocked);

-- Insert a default client for testing (optional)
-- INSERT INTO clients (client_id, client_key, name, idle_timeout) 
-- VALUES ('test-client', 'test-key-replace-in-production', 'Test Application', 1800);

-- Grant permissions (adjust as needed for your PostgreSQL user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;