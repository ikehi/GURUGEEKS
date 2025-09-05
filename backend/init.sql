-- Database initialization script for News Aggregator
-- This script creates the database and sets up initial configuration

-- Create database if it doesn't exist
-- Note: This needs to be run as a superuser or database owner
-- CREATE DATABASE news_aggregator;

-- Connect to the database
-- \c news_aggregator;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created automatically by SQLAlchemy models, but we can add custom ones here

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
-- These will be created by the application when tables are created

-- Grant necessary permissions
-- GRANT ALL PRIVILEGES ON DATABASE news_aggregator TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
