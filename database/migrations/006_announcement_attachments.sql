-- File đính kèm cho thông báo: [{url, name, type}]
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
