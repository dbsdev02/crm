-- Add color column to projects for Todoist-style project colors
USE crm_database;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#4073ff';
