-- ============================================================
--  CRM Production Migration — run once on Coolify MySQL
--  Safe to re-run: all operations check before applying
-- ============================================================

USE crm_database;

-- ── 1. task_sections ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_sections (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT          NOT NULL,
  name        VARCHAR(255) NOT NULL,
  order_index INT          DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ── 2. task_comments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  task_id    INT  NOT NULL,
  user_id    INT  NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE
);

-- ── 3. Safe column + FK additions ────────────────────────────
DROP PROCEDURE IF EXISTS crm_migrate;

DELIMITER $$
CREATE PROCEDURE crm_migrate()
BEGIN

  -- tasks: section_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND COLUMN_NAME  = 'section_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN section_id INT DEFAULT NULL;
  END IF;

  -- tasks: parent_task_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND COLUMN_NAME  = 'parent_task_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN parent_task_id INT DEFAULT NULL;
  END IF;

  -- tasks: order_index
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND COLUMN_NAME  = 'order_index'
  ) THEN
    ALTER TABLE tasks ADD COLUMN order_index INT DEFAULT 0;
  END IF;

  -- tasks: depth_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND COLUMN_NAME  = 'depth_level'
  ) THEN
    ALTER TABLE tasks ADD COLUMN depth_level TINYINT DEFAULT 0;
  END IF;

  -- tasks: labels
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND COLUMN_NAME  = 'labels'
  ) THEN
    ALTER TABLE tasks ADD COLUMN labels VARCHAR(500) DEFAULT NULL;
  END IF;

  -- projects: color
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'projects'
      AND COLUMN_NAME  = 'color'
  ) THEN
    ALTER TABLE projects ADD COLUMN color VARCHAR(20) DEFAULT '#4073ff';
  END IF;

  -- FK: tasks.section_id → task_sections.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'tasks'
      AND CONSTRAINT_NAME   = 'fk_task_section'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT fk_task_section
      FOREIGN KEY (section_id) REFERENCES task_sections(id) ON DELETE SET NULL;
  END IF;

  -- FK: tasks.parent_task_id → tasks.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'tasks'
      AND CONSTRAINT_NAME   = 'fk_task_parent'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT fk_task_parent
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;

  -- Index: tasks.section_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND INDEX_NAME   = 'idx_tasks_section'
  ) THEN
    ALTER TABLE tasks ADD INDEX idx_tasks_section (section_id);
  END IF;

  -- Index: tasks.parent_task_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND INDEX_NAME   = 'idx_tasks_parent'
  ) THEN
    ALTER TABLE tasks ADD INDEX idx_tasks_parent (parent_task_id);
  END IF;

  -- Index: tasks.project_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND INDEX_NAME   = 'idx_tasks_project'
  ) THEN
    ALTER TABLE tasks ADD INDEX idx_tasks_project (project_id);
  END IF;

  -- Index: task_comments.task_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'task_comments'
      AND INDEX_NAME   = 'idx_task_comments'
  ) THEN
    ALTER TABLE task_comments ADD INDEX idx_task_comments (task_id);
  END IF;

END$$
DELIMITER ;

CALL crm_migrate();
DROP PROCEDURE IF EXISTS crm_migrate;

-- ── Done ─────────────────────────────────────────────────────
SELECT 'Migration completed successfully' AS status;
