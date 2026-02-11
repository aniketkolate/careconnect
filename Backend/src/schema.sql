-- ============================
-- ENUM TYPES
-- ============================

CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'CARE_SEEKER',
  'CARE_TAKER'
);

CREATE TYPE request_status AS ENUM (
  'CREATED',
  'ASSIGNED',
  'PENDING_ACCEPTANCE',
  'ONGOING',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'PAID'
);

CREATE TYPE availability_slot AS ENUM (
  'MORNING',
  'AFTERNOON',
  'EVENING'
);

CREATE TYPE day_of_week AS ENUM (
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
);

-- ============================
-- USERS
-- ============================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone VARCHAR(15) NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- CARE SEEKER PROFILE
-- ============================

CREATE TABLE care_seeker_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  address TEXT,
  age INT,
  gender VARCHAR(10),
  emergency_contact VARCHAR(15),
  profile_image TEXT,
  is_profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_seeker_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ============================
-- CARE TAKER PROFILE
-- ============================

CREATE TABLE care_taker_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  experience_years INT,
  skills TEXT,
  hourly_rate NUMERIC(10,2),
  profile_image TEXT,
  is_profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_taker_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ============================
-- CARE REQUESTS
-- ============================

CREATE TABLE care_requests (
  id SERIAL PRIMARY KEY,
  seeker_id INT NOT NULL,
  care_type VARCHAR(100) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status request_status DEFAULT 'CREATED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_request_seeker
    FOREIGN KEY (seeker_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ============================
-- CARE ASSIGNMENTS
-- ============================

CREATE TABLE care_assignments (
  id SERIAL PRIMARY KEY,
  care_request_id INT UNIQUE NOT NULL,
  caretaker_id INT NOT NULL,
  assigned_by INT NOT NULL, -- admin id
  status request_status DEFAULT 'PENDING_ACCEPTANCE',
  amount NUMERIC(10,2),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignment_request
    FOREIGN KEY (care_request_id)
    REFERENCES care_requests(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_assignment_taker
    FOREIGN KEY (caretaker_id)
    REFERENCES users(id),
  CONSTRAINT fk_assignment_admin
    FOREIGN KEY (assigned_by)
    REFERENCES users(id)
);

-- ============================
-- PAYMENTS
-- ============================

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  care_request_id INT UNIQUE NOT NULL,
  seeker_id INT NOT NULL,
  caretaker_id INT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status payment_status DEFAULT 'PENDING',
  payment_mode VARCHAR(50),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_request
    FOREIGN KEY (care_request_id)
    REFERENCES care_requests(id),
  CONSTRAINT fk_payment_seeker
    FOREIGN KEY (seeker_id)
    REFERENCES users(id),
  CONSTRAINT fk_payment_taker
    FOREIGN KEY (caretaker_id)
    REFERENCES users(id)
);

-- ============================
-- CARE TAKER AVAILABILITY
-- ============================

DROP TABLE IF EXISTS caretaker_availability;

CREATE TABLE caretaker_availability (
  id SERIAL PRIMARY KEY,
  caretaker_id INT NOT NULL,
  day day_of_week NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_availability_taker
    FOREIGN KEY (caretaker_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT unique_availability UNIQUE (caretaker_id, day)
);

-- ============================
-- NOTIFICATIONS
-- ============================

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ============================
-- ACTIVITY LOGS
-- ============================

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  activity_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

-- ============================
-- INDEXES (Performance)
-- ============================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_requests_status ON care_requests(status);
CREATE INDEX idx_assignments_status ON care_assignments(status);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);

