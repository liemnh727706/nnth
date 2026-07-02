#!/bin/bash
# Deploy dùng IP trực tiếp (không cần domain/SSL)
# Dùng khi chưa có domain hoặc test nhanh
# Chạy trên server: bash /opt/nnth/scripts/deploy-ip.sh

set -e
cd /opt/nnth

SERVER_IP="64.110.116.239"

echo "==> Tạo .env nếu chưa có"
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  # Ghi đè các giá trị cần thiết cho môi trường production IP
  sed -i "s|NODE_ENV=development|NODE_ENV=production|g" server/.env
  sed -i "s|CLIENT_URL=http://localhost:3000|CLIENT_URL=http://${SERVER_IP}|g" server/.env
  sed -i "s|SERVER_URL=http://localhost:5000|SERVER_URL=http://${SERVER_IP}|g" server/.env
  sed -i "s|GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=http://${SERVER_IP}/api/auth/google/callback|g" server/.env
  echo "⚠ Đã tạo server/.env từ template. Hãy kiểm tra và cập nhật:"
  echo "   - DB_PASSWORD"
  echo "   - JWT_SECRET / JWT_REFRESH_SECRET"
  echo "   - Các key thanh toán (nếu cần)"
  echo "   nano server/.env"
  echo "Sau đó chạy lại script này."
  exit 1
fi

echo "==> Build & start containers (không dùng nginx SSL)"
docker compose up -d --build postgres server client
echo "Đợi PostgreSQL khởi động..."
sleep 12

echo "==> Chạy database migrations"
docker compose exec -T server node database/migrate.js || true

echo "==> Health check"
sleep 3
curl -f "http://localhost:5000/api/health" && echo " Backend OK"
curl -f "http://localhost:3000" -o /dev/null -s && echo " Frontend OK"

echo ""
echo "============================================"
echo " Deploy thành công!"
echo " Frontend : http://${SERVER_IP}:3000"
echo " API      : http://${SERVER_IP}:5000/api"
echo "============================================"
