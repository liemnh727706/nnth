#!/bin/bash
# Chạy MỘT LẦN sau khi setup server và điền .env xong
set -e

cd /opt/nnth

echo "==> Lấy SSL certificate (cần domain đã trỏ về server này)"
sudo certbot certonly --standalone \
  -d nnth.hcmuaf.edu.vn \
  --email liemnh@hcmuaf.edu.vn \
  --agree-tos --non-interactive

echo "==> Copy cert cho nginx"
sudo cp /etc/letsencrypt/live/nnth.hcmuaf.edu.vn/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/nnth.hcmuaf.edu.vn/privkey.pem  nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*.pem

echo "==> Build & start tất cả containers"
docker compose up -d --build

echo "==> Chờ PostgreSQL sẵn sàng"
sleep 10

echo "==> Chạy migrations"
docker compose exec -T server node database/migrate.js

echo "==> Cài cron tự renew SSL (mỗi tháng)"
(crontab -l 2>/dev/null; echo "0 3 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/nnth.hcmuaf.edu.vn/fullchain.pem /opt/nnth/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/nnth.hcmuaf.edu.vn/privkey.pem /opt/nnth/nginx/ssl/key.pem && docker compose -f /opt/nnth/docker-compose.yml exec -T nginx nginx -s reload") | crontab -

echo "==> Kiểm tra health"
curl -f https://nnth.hcmuaf.edu.vn/api/health && echo " OK"

echo ""
echo "✓ Deploy thành công! Website: https://nnth.hcmuaf.edu.vn"
