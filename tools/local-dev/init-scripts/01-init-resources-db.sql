-- Initialize resources database for resource-nodejs-service
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create resources database
CREATE DATABASE resources;

-- Grant all privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE resources TO postgres;

-- Log success
\echo 'Database "resources" created successfully'
