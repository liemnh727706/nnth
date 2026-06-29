-- ============================================================
-- NNTH HCMUAF - Database Schema
-- PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('student', 'staff', 'super_admin');
CREATE TYPE course_category AS ENUM ('foreign_language', 'informatics');
CREATE TYPE language_type AS ENUM ('english', 'japanese', 'chinese', 'korean', 'other');
CREATE TYPE enrollment_status AS ENUM ('pending_payment', 'pending_admin', 'confirmed', 'cancelled', 'waitlisted');
CREATE TYPE payment_method AS ENUM ('vnpay', 'momo', 'zalopay', 'stripe', 'bank_transfer', 'cash', 'admin_confirm');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE exam_result_source AS ENUM ('excel_upload', 'pdf_upload', 'api_import', 'manual');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_number       VARCHAR(12) UNIQUE NOT NULL,        -- CCCD - primary identifier
  student_code    VARCHAR(20) UNIQUE,
  email           VARCHAR(255) UNIQUE NOT NULL,
  google_id       VARCHAR(255) UNIQUE,
  password_hash   VARCHAR(255),
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  date_of_birth   DATE,
  place_of_birth  VARCHAR(255),
  phone           VARCHAR(15),
  avatar_url      TEXT,
  role            user_role NOT NULL DEFAULT 'student',
  email_verified  BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id_number ON users(id_number);
CREATE INDEX idx_users_student_code ON users(student_code);

-- ============================================================
-- EMAIL VERIFICATION TOKENS
-- ============================================================
CREATE TABLE email_verification_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(512) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(20) UNIQUE NOT NULL,
  name_vi         VARCHAR(255) NOT NULL,
  name_en         VARCHAR(255) NOT NULL,
  description_vi  TEXT,
  description_en  TEXT,
  category        course_category NOT NULL,
  language_type   language_type,                      -- NULL for informatics
  level           VARCHAR(50),                        -- A1, A2, B1, B2, C1, C2, N1-N5, HSK1-6...
  duration_hours  INTEGER,
  tuition_fee     NUMERIC(12, 0) NOT NULL DEFAULT 0,  -- VND
  max_students    INTEGER NOT NULL DEFAULT 30,
  current_students INTEGER NOT NULL DEFAULT 0,
  instructor_name VARCHAR(255),
  location        VARCHAR(255),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  schedule        TEXT,                               -- "Thứ 2, 4, 6 - 18:00-20:00"
  thumbnail_url   TEXT,
  syllabus_url    TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_dates CHECK (end_date > start_date),
  CONSTRAINT chk_students CHECK (current_students >= 0 AND current_students <= max_students)
);

CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_start_date ON courses(start_date);
CREATE INDEX idx_courses_is_active ON courses(is_active);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  status          enrollment_status NOT NULL DEFAULT 'pending_payment',
  enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ,
  confirmed_by    UUID REFERENCES users(id),
  cancelled_at    TIMESTAMPTZ,
  cancelled_by    UUID REFERENCES users(id),
  notes           TEXT,
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id       UUID NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
  amount              NUMERIC(12, 0) NOT NULL,
  currency            VARCHAR(3) NOT NULL DEFAULT 'VND',
  method              payment_method NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  transaction_id      VARCHAR(255),                   -- Gateway transaction ID
  gateway_response    JSONB,                          -- Raw response from payment gateway
  receipt_url         TEXT,
  paid_at             TIMESTAMPTZ,
  confirmed_by        UUID REFERENCES users(id),      -- For admin_confirm method
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- ============================================================
-- EXAM RESULTS
-- ============================================================
CREATE TABLE exam_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  exam_date       DATE NOT NULL,
  score           NUMERIC(5, 2),
  grade           VARCHAR(10),                        -- A, B, C, D, F or Pass/Fail
  remarks         TEXT,
  source          exam_result_source NOT NULL DEFAULT 'manual',
  source_file_url TEXT,
  published_at    TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exam_results_student ON exam_results(student_id);
CREATE INDEX idx_exam_results_course ON exam_results(course_id);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_vi    VARCHAR(500) NOT NULL,
  title_en    VARCHAR(500),
  content_vi  TEXT NOT NULL,
  content_en  TEXT,
  category    VARCHAR(50) DEFAULT 'general',         -- 'exam_result', 'enrollment', 'general'
  course_id   UUID REFERENCES courses(id),           -- NULL = all students
  is_pinned   BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_exam_results_updated_at BEFORE UPDATE ON exam_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: auto-update course student count
-- ============================================================
CREATE OR REPLACE FUNCTION update_course_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE courses SET current_students = current_students + 1 WHERE id = NEW.course_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE courses SET current_students = current_students + 1 WHERE id = NEW.course_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status IN ('cancelled', 'waitlisted') THEN
      UPDATE courses SET current_students = current_students - 1 WHERE id = NEW.course_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE courses SET current_students = current_students - 1 WHERE id = OLD.course_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enrollment_count
AFTER INSERT OR UPDATE OR DELETE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_course_student_count();
