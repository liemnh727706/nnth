-- Thêm hình thức học và tiếng Việt vào language_type
ALTER TYPE language_type ADD VALUE IF NOT EXISTS 'vietnamese';

CREATE TYPE delivery_mode AS ENUM ('online', 'offline', 'hybrid');

ALTER TABLE courses ADD COLUMN IF NOT EXISTS delivery_mode delivery_mode DEFAULT 'offline';
