-- Email phụ (không bắt buộc) cho hồ sơ người dùng
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_email VARCHAR(255);
