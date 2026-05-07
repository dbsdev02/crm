-- Run this migration to add hierarchical task support
USE crm_database;

-- Task sections (belong to a project)
CREATE TABLE IF NOT EXISTS task_sections (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT NOT NULL,
  name        VARCHAR(255) NOT NULL,
  order_index INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Add hierarchy columns to tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS section_id     INT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parent_task_id INT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS order_index    INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS depth_level    TINYINT      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_id        INT          DEFAULT NULL;

-- Foreign keys (ignore error if already exists)
ALTER TABLE tasks
  ADD CONSTRAINT fk_task_section    FOREIGN KEY (section_id)     REFERENCES task_sections(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_task_parent     FOREIGN KEY (parent_task_id) REFERENCES tasks(id)         ON DELETE CASCADE,
  ADD CONSTRAINT fk_task_lead       FOREIGN KEY (lead_id)        REFERENCES leads(id)          ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project   ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_section   ON tasks(section_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent    ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due       ON tasks(due_date);
