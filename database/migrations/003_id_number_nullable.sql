-- Cho phép id_number NULL: user đăng nhập Google lần đầu chưa có CCCD,
-- sẽ bổ sung trong trang hồ sơ trước khi ghi danh khóa học
ALTER TABLE users ALTER COLUMN id_number DROP NOT NULL;
