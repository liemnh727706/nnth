#!/bin/bash
# Chạy lần đầu trên Oracle Cloud Ubuntu 22.04
# ssh ubuntu@<IP> "bash -s" < setup-oracle.sh

set -e

echo "==> Cập nhật hệ thống"
sudo apt-get update -y && sudo apt-get upgrade -y

echo "==> Cài Docker"
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo usermod -aG docker $USER
sudo systemctl enable docker

echo "==> Cài Certbot (Let's Encrypt)"
sudo apt-get install -y certbot

echo "==> Mở firewall Oracle Cloud (iptables)"
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

echo "==> Clone repo"
sudo mkdir -p /opt/nnth
sudo chown $USER:$USER /opt/nnth
git clone https://github.com/YOUR_ORG/nnth-hcmuaf.git /opt/nnth

echo "==> Tạo thư mục cần thiết"
mkdir -p /opt/nnth/nginx/ssl

echo "==> Xong! Tiếp theo:"
echo "  1. Chỉnh sửa /opt/nnth/server/.env"
echo "  2. Chạy: cd /opt/nnth && bash scripts/first-deploy.sh"
