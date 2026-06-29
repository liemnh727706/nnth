# Hướng dẫn Deploy lên Oracle Cloud

## Yêu cầu

- Oracle Cloud VM: Ubuntu 22.04, tối thiểu 2 OCPU + 4GB RAM (shape: VM.Standard.E2.1.Micro free tier OK cho demo)
- Domain `nnth.hcmuaf.edu.vn` đã trỏ A record về IP của VM
- GitHub repository đã push code

---

## Bước 1 — Tạo VM Oracle Cloud

1. Đăng nhập [cloud.oracle.com](https://cloud.oracle.com)
2. **Compute → Instances → Create Instance**
   - Image: Ubuntu 22.04
   - Shape: VM.Standard.E2.1.Micro (Always Free) hoặc lớn hơn
   - VCN: tạo mới hoặc dùng sẵn
   - **Add SSH key**: paste public key của máy bạn (`~/.ssh/id_rsa.pub`)
3. Sau khi tạo xong, ghi lại **Public IP**

### Mở port trên Oracle Security List

Vào **Networking → Virtual Cloud Networks → [VCN của bạn] → Security Lists → Default**:
- Add Ingress Rule: Port **80** (HTTP), Source `0.0.0.0/0`
- Add Ingress Rule: Port **443** (HTTPS), Source `0.0.0.0/0`

---

## Bước 2 — Kết nối SSH và setup server

```bash
ssh ubuntu@<PUBLIC_IP>

# Tải và chạy script setup (chỉ chạy 1 lần)
curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/nnth-hcmuaf/main/scripts/setup-oracle.sh | bash
```

> Sau khi chạy xong, **logout và login lại** để group `docker` có hiệu lực.

---

## Bước 3 — Cấu hình biến môi trường

```bash
ssh ubuntu@<PUBLIC_IP>
cd /opt/nnth
cp server/.env.example server/.env
nano server/.env
```

Điền các giá trị thực tế:

```env
NODE_ENV=production
DB_PASSWORD=<mật_khẩu_mạnh>

JWT_SECRET=<chuỗi_random_64_ký_tự>
JWT_REFRESH_SECRET=<chuỗi_random_64_ký_tự>

GOOGLE_CLIENT_ID=<từ_Google_Cloud_Console>
GOOGLE_CLIENT_SECRET=<từ_Google_Cloud_Console>
GOOGLE_CALLBACK_URL=https://nnth.hcmuaf.edu.vn/api/auth/google/callback

SMTP_USER=<email_gmail>
SMTP_PASS=<app_password_16_ký_tự>

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

VNPAY_TMN_CODE=<từ_VNPay_merchant>
VNPAY_HASH_SECRET=<từ_VNPay_merchant>
VNPAY_URL=https://pay.vnpay.vn/vpcpay.html
VNPAY_RETURN_URL=https://nnth.hcmuaf.edu.vn/payment/result

MOMO_PARTNER_CODE=<production>
MOMO_ACCESS_KEY=<production>
MOMO_SECRET_KEY=<production>

ZALOPAY_APP_ID=<production>
ZALOPAY_KEY1=<production>
ZALOPAY_KEY2=<production>

SERVER_URL=https://nnth.hcmuaf.edu.vn
CLIENT_URL=https://nnth.hcmuaf.edu.vn
```

---

## Bước 4 — Deploy lần đầu

```bash
cd /opt/nnth
bash scripts/first-deploy.sh
```

Script này sẽ tự động:
- Lấy SSL certificate từ Let's Encrypt
- Build và start tất cả Docker containers
- Chạy database migrations
- Cài cron job tự renew SSL hàng tháng
- Kiểm tra health check

---

## Bước 5 — Cấu hình GitHub Actions (CI/CD tự động)

### Thêm SSH key deploy

Trên máy local:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/nnth_deploy -N ""
# Copy public key lên server
ssh-copy-id -i ~/.ssh/nnth_deploy.pub ubuntu@<PUBLIC_IP>
```

### Thêm Secrets vào GitHub

Vào **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Giá trị |
|--------|---------|
| `ORACLE_HOST` | Public IP của VM |
| `ORACLE_USER` | `ubuntu` |
| `ORACLE_SSH_KEY` | Nội dung file `~/.ssh/nnth_deploy` (private key) |

### Cách hoạt động

Sau khi setup xong, mỗi khi push lên branch `main`:
1. GitHub Actions SSH vào server
2. `git pull` code mới
3. `docker compose build` lại images
4. `docker compose up -d` khởi động lại
5. Chạy migrations nếu có
6. Kiểm tra health check

---

## Lệnh quản lý thường dùng

```bash
# Xem logs
docker compose logs -f server
docker compose logs -f nginx

# Restart một service
docker compose restart server

# Vào PostgreSQL
docker compose exec postgres psql -U postgres nnth_hcmuaf

# Backup database
docker compose exec postgres pg_dump -U postgres nnth_hcmuaf > backup_$(date +%Y%m%d).sql

# Xem trạng thái containers
docker compose ps
```

---

## Cấu hình Google OAuth

1. Vào [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   - `https://nnth.hcmuaf.edu.vn/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback` (cho dev)
5. Copy `Client ID` và `Client Secret` vào `.env`

---

## Cấu hình Stripe Webhook

```bash
# Cài Stripe CLI
stripe listen --forward-to https://nnth.hcmuaf.edu.vn/api/payments/stripe/webhook
```

Hoặc vào [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks → Add endpoint:
- URL: `https://nnth.hcmuaf.edu.vn/api/payments/stripe/webhook`
- Events: `payment_intent.succeeded`
- Copy `Signing secret` → `STRIPE_WEBHOOK_SECRET`

---

## Kiến trúc deploy

```
Internet
   │ :443 HTTPS
   ▼
[Nginx] ─────────────────────────────┐
   │ /api/*  proxy_pass              │ /  proxy_pass
   ▼                                 ▼
[Express :5000]              [React Static :80]
   │
   ▼
[PostgreSQL :5432]
```
