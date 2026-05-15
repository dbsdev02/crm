-- Add super_admin role
USE crm_database;
ALTER TABLE roles MODIFY COLUMN name ENUM('super_admin','admin','staff','user') NOT NULL;
INSERT IGNORE INTO roles (name, description) VALUES ('super_admin', 'Super administrator — manages all admins and system');

-- Seed super admin user (password: superadmin123)
INSERT INTO users (email, password, name) VALUES
('superadmin@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Super Admin')
ON DUPLICATE KEY UPDATE name = name;

SET @super_role_id = (SELECT id FROM roles WHERE name = 'super_admin');
SET @super_user_id = (SELECT id FROM users WHERE email = 'superadmin@crm.com');
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (@super_user_id, @super_role_id);
