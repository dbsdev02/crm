-- Smart task parser columns migration
-- Safe to re-run
USE crm_database;

DROP PROCEDURE IF EXISTS crm_smart_migrate;

DELIMITER $$
CREATE PROCEDURE crm_smart_migrate()
BEGIN

  -- tasks: recurring_rule (e.g. "Every monday", "Every day")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND COLUMN_NAME  = 'recurring_rule'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurring_rule VARCHAR(100) DEFAULT NULL;
  END IF;

  -- tasks: reminder_at (datetime for reminder notification)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tasks'
      AND COLUMN_NAME  = 'reminder_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN reminder_at DATETIME DEFAULT NULL;
  END IF;

END$$
DELIMITER ;

CALL crm_smart_migrate();
DROP PROCEDURE IF EXISTS crm_smart_migrate;

SELECT 'Smart task columns added successfully' AS status;
