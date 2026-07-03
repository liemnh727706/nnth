#!/bin/bash
# Lấy SSL certificate từ Let's Encrypt cho nnth.hcmuaf.edu.vn
# Chạy SAU KHI DNS đã trỏ về IP server

set -e
DOMAIN="nnth.hcmuaf.edu.vn"
EMAIL="liemnh@hcmuaf.edu.vn"
SSL_DIR="/opt/nnth/nginx/ssl"

echo "==> Cài Certbot"
sudo apt-get install -y certbot

echo "==> Tạm dừng nginx (nếu đang chạy)"
cd /opt/nnth
docker compose stop nginx 2>/dev/null || true

echo "==> Lấy certificate"
sudo certbot certonly --standalone \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive

echo "==> Copy certificate vào thư mục nginx"
sudo mkdir -p "$SSL_DIR"
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$SSL_DIR/fullchain.pem"
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem  "$SSL_DIR/privkey.pem"
sudo chown $USER:$USER "$SSL_DIR"/*.pem

echo "==> Khởi động lại nginx"
docker compose up -d nginx

echo ""
echo "============================================"
echo " SSL OK! Website chạy tại:"
echo " https://$DOMAIN"
echo "============================================"

# Tự động gia hạn SSL (cron job)
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/fullchain.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/privkey.pem && docker compose -f /opt/nnth/docker-compose.yml exec nginx nginx -s reload") | crontab -
echo " Cron tự gia hạn SSL đã được thiết lập."
