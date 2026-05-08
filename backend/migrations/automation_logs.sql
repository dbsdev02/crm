USE crm_database;

CREATE TABLE IF NOT EXISTS automation_logs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  task_id        INT          DEFAULT NULL,
  automation_type VARCHAR(60) NOT NULL,
  metadata       JSON         DEFAULT NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auto_task (task_id),
  INDEX idx_auto_type (automation_type)
);
