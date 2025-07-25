-- Guardian Auth Service Database Initialization Script
-- This script ensures all required tables exist and have proper indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint for email per client
CREATE UNIQUE INDEX IF NOT EXISTS users_email_client_unique 
ON users(email, client_id);

-- Index for client_id lookups
CREATE INDEX IF NOT EXISTS users_client_id_idx ON users(client_id);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_key VARCHAR(500) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    idle_time_out INTEGER DEFAULT 1800,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for client_id lookups
CREATE INDEX IF NOT EXISTS clients_client_id_idx ON clients(client_id);
CREATE INDEX IF NOT EXISTS clients_created_at_idx ON clients(created_at);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    jti VARCHAR(255) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for session management
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_client_id_idx ON sessions(client_id);
CREATE INDEX IF NOT EXISTS sessions_session_id_idx ON sessions(session_id);
CREATE INDEX IF NOT EXISTS sessions_jti_idx ON sessions(jti);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS sessions_active_idx ON sessions(is_active);

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    attempts INTEGER DEFAULT 1,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rate limiting
CREATE INDEX IF NOT EXISTS rate_limits_identifier_client_idx ON rate_limits(identifier, client_id);
CREATE INDEX IF NOT EXISTS rate_limits_blocked_until_idx ON rate_limits(blocked_until);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_email VARCHAR(255),
    client_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    endpoint VARCHAR(500),
    session_id VARCHAR(255),
    response_status INTEGER,
    geo_country VARCHAR(100),
    geo_city VARCHAR(100),
    request_id VARCHAR(255),
    error_code VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS audit_logs_event_type_idx ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS audit_logs_client_id_idx ON audit_logs(client_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_email_idx ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS audit_logs_session_id_idx ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS audit_logs_ip_address_idx ON audit_logs(ip_address);

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a default admin client for testing (optional)
INSERT INTO clients (client_id, client_key, name, description, idle_time_out)
VALUES ('ADMIN1', 'admin-client-key-for-testing-only', 'Admin Test Client', 'Default client for testing', 3600)
ON CONFLICT (client_id) DO NOTHING;

-- Performance optimization: Analyze tables
ANALYZE users, clients, sessions, rate_limits, audit_logs;