-- Migration 010: Add client_confirmation_url to projects
-- Step 7 saves the client's confirmation receipt URL here
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_confirmation_url text;
