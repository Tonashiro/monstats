-- Initialize the monstats database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE monstats TO postgres;

-- Create a dedicated user for the application (optional)
-- CREATE USER monstats_user WITH PASSWORD 'monstats_password';
-- GRANT ALL PRIVILEGES ON DATABASE monstats TO monstats_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO monstats_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO monstats_user; 