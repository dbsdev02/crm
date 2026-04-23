USE crm_database;

-- Drop old web-push table (no longer used)
DROP TABLE IF EXISTS push_subscriptions;

-- Ensure OneSignal player ID table exists
CREATE TABLE IF NOT EXISTS user_onesignal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  player_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id)
);
