-- Run this after schema.sql to add new tables and columns

USE crm_database;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  status ENUM('active', 'inactive', 'prospect') DEFAULT 'active',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add custom_fields JSON column to leads (stores custom field values)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields JSON;

-- Add customer_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS customer_id INT,
  ADD FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Seed sample customers
INSERT INTO customers (name, company, email, phone, address, notes, status, created_by) VALUES
('Sarah Johnson', 'TechCorp Inc.', 'sarah@techcorp.com', '+1-555-0101', '100 Market St, San Francisco, CA', 'Prefers email contact.', 'active', 1),
('Lisa Wang', 'CloudNine', 'lisa@cloudnine.com', '+1-555-0105', '500 Cloud Ave, Seattle, WA', 'Recently onboarded.', 'active', 1),
('Tom Brown', 'WebWorks', 'tom@webworks.com', '+1-555-0106', '22 Web Lane, Austin, TX', 'Long-term retainer client.', 'active', 1),
('Priya Patel', 'Bright Ideas Co.', 'priya@brightideas.com', '+1-555-0110', NULL, 'Evaluating proposal.', 'prospect', 1);
