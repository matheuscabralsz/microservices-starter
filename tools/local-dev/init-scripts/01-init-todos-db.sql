-- Initialize todos database for todo-nodejs-service
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create todos database
CREATE DATABASE todos;

-- Grant all privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE todos TO postgres;

-- Log success
\echo 'Database "todos" created successfully'
