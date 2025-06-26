-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  segment VARCHAR(255) NOT NULL,
  total_customers INTEGER NOT NULL DEFAULT 0,
  new_customers INTEGER NOT NULL DEFAULT 0,
  churned_customers INTEGER NOT NULL DEFAULT 0,
  region VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  call_type VARCHAR(255) NOT NULL,
  total_calls INTEGER NOT NULL DEFAULT 0,
  resolution_rate REAL NOT NULL DEFAULT 0.0,
  avg_handle_time REAL NOT NULL DEFAULT 0.0,
  customer_satisfaction REAL,
  region VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS headcount_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  department VARCHAR(255) NOT NULL,
  total_staff INTEGER NOT NULL DEFAULT 0,
  active_staff INTEGER NOT NULL DEFAULT 0,
  utilization_rate REAL NOT NULL DEFAULT 0.0,
  region VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forecast_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  forecast_date DATE NOT NULL,
  predicted_members INTEGER NOT NULL,
  predicted_calls INTEGER NOT NULL,
  confidence_level REAL NOT NULL DEFAULT 0.0,
  scenario_type VARCHAR(50) NOT NULL DEFAULT 'realistic' CHECK (scenario_type IN ('optimistic', 'realistic', 'pessimistic', 'baseline', 'custom')),
  base_month DATE,
  forecast_months INTEGER DEFAULT 12,
  member_growth_rate REAL DEFAULT 2.5,
  forecast_results JSONB,
  segment_adjustments JSONB,
  call_volume_factors JSONB,
  staffing_parameters JSONB,
  confidence_intervals JSONB,
  computation_time REAL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sample data for membership_data
INSERT INTO membership_data (id, date, segment, total_customers, new_customers, churned_customers, region, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), '2024-01-01', 'Premium', 1250, 45, 12, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-01-01', 'Standard', 2800, 120, 35, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-01-01', 'Basic', 1500, 80, 25, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-02-01', 'Premium', 1290, 52, 8, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-02-01', 'Standard', 2920, 155, 28, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-02-01', 'Basic', 1580, 95, 18, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-03-01', 'Premium', 1335, 58, 15, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-03-01', 'Standard', 3050, 140, 22, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-03-01', 'Basic', 1650, 88, 20, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-04-01', 'Premium', 1380, 62, 18, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-04-01', 'Standard', 3180, 148, 25, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-04-01', 'Basic', 1720, 92, 22, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-05-01', 'Premium', 1425, 68, 20, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-05-01', 'Standard', 3300, 165, 30, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-05-01', 'Basic', 1800, 105, 28, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-06-01', 'Premium', 1475, 72, 22, 'Asia Pacific', NOW(), NOW()),
  (uuid_generate_v4(), '2024-06-01', 'Standard', 3420, 180, 35, 'Asia Pacific', NOW(), NOW()),
  (uuid_generate_v4(), '2024-06-01', 'Basic', 1880, 110, 30, 'Asia Pacific', NOW(), NOW());

-- Sample data for call_data
INSERT INTO call_data (id, date, call_type, total_calls, resolution_rate, avg_handle_time, customer_satisfaction, region, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), '2024-01-01', 'Support', 1450, 87.5, 6.2, 4.2, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-01-01', 'Sales', 820, 92.3, 8.5, 4.5, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-01-01', 'Billing', 680, 91.2, 5.8, 4.1, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-02-01', 'Support', 1520, 88.2, 6.1, 4.3, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-02-01', 'Sales', 890, 93.1, 8.3, 4.6, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-02-01', 'Billing', 720, 90.8, 5.9, 4.2, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-03-01', 'Support', 1620, 89.1, 6.0, 4.4, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-03-01', 'Sales', 950, 94.2, 8.1, 4.7, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-03-01', 'Billing', 750, 91.5, 5.7, 4.3, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-04-01', 'Support', 1720, 89.8, 5.9, 4.5, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-04-01', 'Sales', 1020, 95.1, 7.9, 4.8, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-04-01', 'Billing', 780, 92.2, 5.6, 4.4, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-05-01', 'Support', 1820, 90.5, 5.8, 4.6, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-05-01', 'Sales', 1080, 96.0, 7.7, 4.9, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-05-01', 'Billing', 820, 93.1, 5.5, 4.5, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-06-01', 'Support', 1920, 91.2, 5.7, 4.7, 'Asia Pacific', NOW(), NOW()),
  (uuid_generate_v4(), '2024-06-01', 'Sales', 1150, 97.2, 7.5, 5.0, 'Asia Pacific', NOW(), NOW()),
  (uuid_generate_v4(), '2024-06-01', 'Billing', 860, 94.0, 5.4, 4.6, 'Asia Pacific', NOW(), NOW());

-- Sample data for headcount_data
INSERT INTO headcount_data (id, date, department, total_staff, active_staff, utilization_rate, region, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), '2024-01-01', 'Customer Support', 45, 42, 87.2, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-01-01', 'Sales', 28, 26, 92.5, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-01-01', 'Technical Support', 22, 20, 85.8, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-02-01', 'Customer Support', 47, 44, 88.1, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-02-01', 'Sales', 30, 28, 93.2, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-02-01', 'Technical Support', 24, 22, 86.5, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-03-01', 'Customer Support', 50, 47, 89.0, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-03-01', 'Sales', 32, 30, 94.1, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-03-01', 'Technical Support', 26, 24, 87.2, 'North America', NOW(), NOW()),
  (uuid_generate_v4(), '2024-04-01', 'Customer Support', 52, 49, 89.8, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-04-01', 'Sales', 34, 32, 95.0, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-04-01', 'Technical Support', 28, 26, 88.1, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-05-01', 'Customer Support', 55, 52, 90.5, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-05-01', 'Sales', 36, 34, 96.2, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-05-01', 'Technical Support', 30, 28, 89.0, 'Europe', NOW(), NOW()),
  (uuid_generate_v4(), '2024-06-01', 'Customer Support', 58, 55, 91.2, 'Asia Pacific', NOW(), NOW()),
  (uuid_generate_v4(), '2024-06-01', 'Sales', 38, 36, 97.1, 'Asia Pacific', NOW(), NOW()),
  (uuid_generate_v4(), '2024-06-01', 'Technical Support', 32, 30, 89.8, 'Asia Pacific', NOW(), NOW());

-- Sample data for forecast_scenarios
INSERT INTO forecast_scenarios (id, name, description, forecast_date, predicted_members, predicted_calls, confidence_level, scenario_type, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), 'Q3 2024 Conservative', 'Conservative growth projection for Q3 2024', '2024-07-01', 8200, 4800, 0.85, 'pessimistic', NOW(), NOW()),
  (uuid_generate_v4(), 'Q3 2024 Realistic', 'Realistic growth projection for Q3 2024', '2024-07-01', 8850, 5200, 0.92, 'realistic', NOW(), NOW()),
  (uuid_generate_v4(), 'Q3 2024 Optimistic', 'Optimistic growth projection for Q3 2024', '2024-07-01', 9500, 5800, 0.78, 'optimistic', NOW(), NOW()),
  (uuid_generate_v4(), 'Q4 2024 Conservative', 'Conservative growth projection for Q4 2024', '2024-10-01', 8800, 5200, 0.83, 'pessimistic', NOW(), NOW()),
  (uuid_generate_v4(), 'Q4 2024 Realistic', 'Realistic growth projection for Q4 2024', '2024-10-01', 9600, 5800, 0.89, 'realistic', NOW(), NOW()),
  (uuid_generate_v4(), 'Q4 2024 Optimistic', 'Optimistic growth projection for Q4 2024', '2024-10-01', 10500, 6500, 0.75, 'optimistic', NOW(), NOW());

-- Create a default admin user (password: admin123)
INSERT INTO users (id, email, password, first_name, last_name, role, is_active, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin', true, NOW(), NOW()),
  (uuid_generate_v4(), 'user@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'User', 'user', true, NOW(), NOW()); 