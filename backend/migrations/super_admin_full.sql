-- ============================================================
--  SUPER ADMIN FULL MIGRATION
--  Run this on your existing crm_database
--  Safe to run multiple times (uses IF NOT EXISTS + IGNORE)
-- ============================================================

USE crm_database;

-- ─────────────────────────────────────────────────────────────
-- 1. Add super_admin to roles ENUM
-- ─────────────────────────────────────────────────────────────
ALTER TABLE roles
  MODIFY COLUMN name ENUM('super_admin','admin','staff','user') NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Insert super_admin role (safe, won't duplicate)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO roles (name, description)
  VALUES ('super_admin', 'Super administrator — full system access, manages all admins and settings');

-- ─────────────────────────────────────────────────────────────
-- 3. Create super admin user
--    Email    : superadmin@crm.com
--    Password : superadmin123
-- ─────────────────────────────────────────────────────────────
INSERT INTO users (email, password, name, is_active)
  VALUES (
    'superadmin@crm.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Super Admin',
    TRUE
  )
  ON DUPLICATE KEY UPDATE
    name      = VALUES(name),
    is_active = TRUE;

-- ─────────────────────────────────────────────────────────────
-- 4. Assign super_admin role to the user
-- ─────────────────────────────────────────────────────────────
SET @super_role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1);
SET @super_user_id = (SELECT id FROM users  WHERE email = 'superadmin@crm.com' LIMIT 1);

INSERT IGNORE INTO user_roles (user_id, role_id)
  VALUES (@super_user_id, @super_role_id);

-- ─────────────────────────────────────────────────────────────
-- 5. system_settings table  (used by Admin Settings & AI panel)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  `key`      VARCHAR(100) PRIMARY KEY,
  `value`    TEXT         NOT NULL DEFAULT '',
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO system_settings (`key`, `value`) VALUES
-- Branding
('app_name',              'Internal'),
('support_email',         'support@internal.ltd'),
('primary_color',         '#db4035'),
('logo_url',              ''),
('frontend_url',          ''),
('backend_url',           ''),
-- SMTP
('smtp_host',             ''),
('smtp_port',             '587'),
('smtp_user',             ''),
('smtp_pass',             ''),
-- Security
('mfa_required',          'false'),
('sso_enabled',           'false'),
('ip_whitelist',          'false'),
('session_timeout',       '24h'),
-- AI / Automation toggles
('ai_nlp_parser',         'true'),
('ai_smart_schedule',     'true'),
('ai_recurring',          'true'),
('ai_suggestions',        'false'),
('ai_smart_reminders',    'true'),
('ai_overdue_nudge',      'true'),
('ai_auto_labels',        'false'),
('ai_summary',            'true');

-- ─────────────────────────────────────────────────────────────
-- 6. automation_logs table  (used by Admin Dashboard KPIs)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  type        VARCHAR(100)  NOT NULL DEFAULT 'cron',
  status      ENUM('running','completed','failed','paused','queued') DEFAULT 'completed',
  triggered_by VARCHAR(100) DEFAULT 'scheduler',
  details     TEXT,
  started_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP     NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- 7. support_tickets table  (used by Admin Support Center)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  type        ENUM('bug','feature','support','feedback') DEFAULT 'support',
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  priority    ENUM('low','medium','high') DEFAULT 'medium',
  status      ENUM('open','in_progress','resolved') DEFAULT 'open',
  assigned_to INT           NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 8. Update /api/admin/support to use support_tickets
--    (backend already falls back to activity_logs if table
--     doesn't exist, but now we have a proper table)
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- 9. Seed a few sample support tickets (optional, remove if
--    you don't want demo data)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO support_tickets (id, user_id, type, title, description, priority, status)
  SELECT 1, @super_user_id, 'bug',     'Sample bug report',    'Recurring tasks not generating on Sunday', 'high',   'open'
  WHERE @super_user_id IS NOT NULL;

INSERT IGNORE INTO support_tickets (id, user_id, type, title, description, priority, status)
  SELECT 2, @super_user_id, 'feature', 'Sample feature request', 'Bulk task import from CSV',              'medium', 'open'
  WHERE @super_user_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 10. Verify — shows what was created
-- ─────────────────────────────────────────────────────────────
SELECT
  u.id,
  u.name,
  u.email,
  u.is_active,
  r.name AS role
FROM users u
JOIN user_roles ur ON u.id  = ur.user_id
JOIN roles r       ON r.id  = ur.role_id
WHERE r.name = 'super_admin';
