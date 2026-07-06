-- Nội dung website chỉnh sửa được từ Admin (ghi đè lên mặc định trong site.js)
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- chỉ 1 dòng duy nhất
  content JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (id, content) VALUES (1, '{}') ON CONFLICT (id) DO NOTHING;
