#!/bin/bash
# Deploy đầy đủ với domain nnth.hcmuaf.edu.vn (port 80/443)
# Yêu cầu: DNS đã trỏ về IP server, SSL đã lấy qua get-ssl.sh

set -e
cd /opt/nnth

DOMAIN="nnth.hcmuaf.edu.vn"

echo "==> Tạo .env nếu chưa có"
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  sed -i "s|CLIENT_URL=.*|CLIENT_URL=https://$DOMAIN|g" server/.env
  sed -i "s|SERVER_URL=.*|SERVER_URL=https://$DOMAIN|g" server/.env
  sed -i "s|GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=https://$DOMAIN/api/auth/google/callback|g" server/.env
  echo "⚠ Đã tạo server/.env — hãy điền credentials thực rồi chạy lại."
  echo "   nano server/.env"
  exit 1
fi

echo "==> Kiểm tra SSL certificate"
if [ ! -f nginx/ssl/fullchain.pem ]; then
  echo "❌ Chưa có SSL. Chạy trước: bash scripts/get-ssl.sh"
  exit 1
fi

echo "==> Pull code mới nhất"
git pull origin main

echo "==> Build & start tất cả services"
docker compose build --no-cache server client
docker compose up -d --remove-orphans postgres server client nginx

echo "==> Chờ DB sẵn sàng"
sleep 15

echo "==> Chạy migrations"
docker compose exec -T server node database/migrate.js || true

echo "==> Health check"
sleep 5
curl -fsSL "https://$DOMAIN/api/health" && echo " Backend OK"

echo ""
echo "============================================"
echo " Deploy thành công!"
echo " Website : https://$DOMAIN"
echo " Admin   : https://$DOMAIN/admin"
echo "============================================"
