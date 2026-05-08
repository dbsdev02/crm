-- ============================================================
--  Coolify Missing Migration — run once
--  Adds missing tables and columns not yet in Coolify
-- ============================================================

USE crm_database;

-- ── 1. Missing columns on existing tables ────────────────────

DROP PROCEDURE IF EXISTS coolify_missing_migrate;

DELIMITER $$
CREATE PROCEDURE coolify_missing_migrate()
BEGIN

  -- tasks: labels
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'labels'
  ) THEN
    ALTER TABLE tasks ADD COLUMN labels VARCHAR(500) DEFAULT NULL;
  END IF;

  -- tasks: section_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'section_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN section_id INT DEFAULT NULL;
  END IF;

  -- tasks: parent_task_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'parent_task_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN parent_task_id INT DEFAULT NULL;
  END IF;

  -- tasks: order_index
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'order_index'
  ) THEN
    ALTER TABLE tasks ADD COLUMN order_index INT DEFAULT 0;
  END IF;

  -- tasks: depth_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'depth_level'
  ) THEN
    ALTER TABLE tasks ADD COLUMN depth_level TINYINT DEFAULT 0;
  END IF;

  -- tasks: recurring_rule
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'recurring_rule'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurring_rule VARCHAR(100) DEFAULT NULL;
  END IF;

  -- tasks: reminder_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'reminder_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN reminder_at DATETIME DEFAULT NULL;
  END IF;

  -- tasks: customer_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'customer_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN customer_id INT DEFAULT NULL;
    ALTER TABLE tasks ADD FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;

  -- projects: color
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'color'
  ) THEN
    ALTER TABLE projects ADD COLUMN color VARCHAR(20) DEFAULT '#4073ff';
  END IF;

  -- leads: custom_fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'custom_fields'
  ) THEN
    ALTER TABLE leads ADD COLUMN custom_fields JSON;
  END IF;

  -- FKs for tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND CONSTRAINT_NAME = 'fk_task_section'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT fk_task_section
      FOREIGN KEY (section_id) REFERENCES task_sections(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND CONSTRAINT_NAME = 'fk_task_parent'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT fk_task_parent
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;

  -- Indexes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND INDEX_NAME = 'idx_tasks_section'
  ) THEN
    ALTER TABLE tasks ADD INDEX idx_tasks_section (section_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND INDEX_NAME = 'idx_tasks_parent'
  ) THEN
    ALTER TABLE tasks ADD INDEX idx_tasks_parent (parent_task_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND INDEX_NAME = 'idx_tasks_project'
  ) THEN
    ALTER TABLE tasks ADD INDEX idx_tasks_project (project_id);
  END IF;

END$$
DELIMITER ;

CALL coolify_missing_migrate();
DROP PROCEDURE IF EXISTS coolify_missing_migrate;

-- ── 2. Missing tables ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_goals (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT  NOT NULL,
  goal_date  DATE NOT NULL,
  target     INT  DEFAULT 5,
  completed  INT  DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, goal_date)
);

CREATE TABLE IF NOT EXISTS productivity_scores (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT  NOT NULL UNIQUE,
  karma_score      INT  DEFAULT 0,
  current_streak   INT  DEFAULT 0,
  longest_streak   INT  DEFAULT 0,
  last_active_date DATE DEFAULT NULL,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_modules (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT          NOT NULL,
  title      VARCHAR(255) NOT NULL,
  status     ENUM('pending','in_progress','completed') DEFAULT 'pending',
  sort_order INT          DEFAULT 0,
  created_by INT          NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS module_tasks (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  module_id        INT          NOT NULL,
  project_id       INT          NOT NULL,
  title            VARCHAR(255) NOT NULL,
  assigned_to      INT          DEFAULT NULL,
  due_date         DATE         DEFAULT NULL,
  priority         ENUM('low','medium','high','urgent') DEFAULT 'medium',
  status           ENUM('pending','in_progress','completed') DEFAULT 'pending',
  completion_proof VARCHAR(500) DEFAULT NULL,
  completed_at     DATETIME     DEFAULT NULL,
  created_by       INT          NOT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id)   REFERENCES project_modules(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id)  REFERENCES projects(id)        ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id)           ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id)           ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_issues (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  project_id     INT          NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT         DEFAULT NULL,
  cause_type     ENUM('user','asset','client','technical','other') DEFAULT 'other',
  caused_by_user INT          DEFAULT NULL,
  impact         ENUM('low','medium','high') DEFAULT 'medium',
  status         ENUM('open','resolved') DEFAULT 'open',
  resolved_at    DATETIME     DEFAULT NULL,
  created_by     INT          NOT NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id)     REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (caused_by_user) REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (created_by)     REFERENCES users(id)    ON DELETE CASCADE
);

SELECT 'coolify_missing migration completed' AS status;

-- ── automation_logs (new) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  task_id         INT          DEFAULT NULL,
  automation_type VARCHAR(60)  NOT NULL,
  metadata        JSON         DEFAULT NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auto_task (task_id),
  INDEX idx_auto_type (automation_type)
);

-- ── system_settings (new) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  `key`      VARCHAR(100) PRIMARY KEY,
  `value`    TEXT         NOT NULL,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_settings (`key`, `value`) VALUES ('automation', '{"enabled":true,"interval_sec":60,"overdue":{"enabled":true,"notify":true},"reminder":{"enabled":true,"advance_min":30},"recurring":{"enabled":true},"work_hours":{"enabled":false,"start":"09:00","end":"18:00"},"credits":{"early":2,"on_time":1,"late":-1}}')
ON DUPLICATE KEY UPDATE `key` = `key`;
