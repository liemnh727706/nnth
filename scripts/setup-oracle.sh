#!/bin/bash
# Chạy LẦN ĐẦU trên Oracle Cloud Ubuntu 22.04
# Cách dùng:
#   ssh ubuntu@64.110.116.239 "bash -s" < scripts/setup-oracle.sh

set -e

echo "==> [1/6] Cập nhật hệ thống"
sudo apt-get update -y && sudo apt-get upgrade -y

echo "==> [2/6] Cài Docker Engine"
sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
sudo systemctl enable docker --now
echo "Docker version: $(docker --version)"

echo "==> [3/6] Mở firewall Oracle (iptables)"
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 22  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

echo "==> [4/6] Cài Certbot"
sudo apt-get install -y certbot

echo "==> [5/6] Clone repository"
sudo mkdir -p /opt/nnth
sudo chown $USER:$USER /opt/nnth
git clone https://github.com/liemnh727706/nnth.git /opt/nnth
cd /opt/nnth

echo "==> [6/6] Tạo thư mục cần thiết"
mkdir -p /opt/nnth/nginx/ssl
mkdir -p /opt/nnth/server/uploads
mkdir -p /opt/nnth/server/logs

echo ""
echo "============================================"
echo " Setup hoàn tất!"
echo " BƯỚC TIẾP THEO:"
echo "   1. Điền biến môi trường:"
echo "      nano /opt/nnth/server/.env"
echo "   2. Nếu có domain, chạy deploy đầy đủ:"
echo "      bash /opt/nnth/scripts/first-deploy.sh"
echo "   3. Nếu chỉ dùng IP (không có domain):"
echo "      bash /opt/nnth/scripts/deploy-ip.sh"
echo "============================================"
