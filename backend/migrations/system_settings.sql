USE crm_database;

CREATE TABLE IF NOT EXISTS system_settings (
  `key`   VARCHAR(100) PRIMARY KEY,
  `value` TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO system_settings (`key`, `value`) VALUES
('app_name',       'Internal'),
('support_email',  'support@internal.ltd'),
('primary_color',  '#db4035'),
('smtp_host',      ''),
('smtp_port',      '587'),
('smtp_user',      ''),
('mfa_required',   'false'),
('sso_enabled',    'false'),
('ip_whitelist',   'false'),
('ai_nlp_parser',      'true'),
('ai_smart_schedule',  'true'),
('ai_recurring',       'true'),
('ai_suggestions',     'false'),
('ai_smart_reminders', 'true'),
('ai_overdue_nudge',   'true'),
('ai_auto_labels',     'false'),
('ai_summary',         'true');
