#!/bin/bash
# ===========================================
# GET2B Server Setup Script
# Target: Ubuntu 24.04 VPS
# Run as root: bash server-setup.sh
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== GET2B Server Setup ===${NC}"

# --- 1. System Update ---
echo -e "${YELLOW}[1/8] System update...${NC}"
apt update && apt upgrade -y

# --- 2. Install required packages ---
echo -e "${YELLOW}[2/8] Installing packages...${NC}"
apt install -y \
  curl \
  git \
  ufw \
  fail2ban \
  certbot \
  python3-certbot-nginx \
  nginx \
  htop \
  unzip

# --- 3. Install Docker ---
echo -e "${YELLOW}[3/8] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}Docker installed${NC}"
else
  echo -e "${GREEN}Docker already installed${NC}"
fi

# --- 4. Firewall (UFW) ---
echo -e "${YELLOW}[4/8] Configuring firewall...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (for certbot)
ufw allow 443/tcp  # HTTPS
echo "y" | ufw enable
ufw status verbose

# --- 5. fail2ban ---
echo -e "${YELLOW}[5/8] Configuring fail2ban...${NC}"
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/get2b-error.log
maxretry = 10
findtime = 120
bantime = 600
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo -e "${GREEN}fail2ban configured${NC}"

# --- 6. SSH Hardening ---
echo -e "${YELLOW}[6/8] SSH hardening...${NC}"
# Ensure password auth is disabled
if grep -q "^PasswordAuthentication yes" /etc/ssh/sshd_config; then
  sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
  systemctl restart sshd
  echo -e "${GREEN}Password auth disabled${NC}"
else
  echo -e "${GREEN}Password auth already disabled${NC}"
fi

# --- 7. Swap (2GB) ---
echo -e "${YELLOW}[7/8] Setting up swap...${NC}"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Optimize swap usage
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  sysctl -p
  echo -e "${GREEN}2GB swap created${NC}"
else
  echo -e "${GREEN}Swap already exists${NC}"
fi

# --- 8. Nginx + SSL ---
echo -e "${YELLOW}[8/8] Nginx and SSL setup...${NC}"

# Copy nginx configs
mkdir -p /var/www/certbot
cp /var/www/godplis/nginx/get2b-ratelimit.conf /etc/nginx/conf.d/get2b-ratelimit.conf
cp /var/www/godplis/nginx/get2b.conf /etc/nginx/sites-available/get2b.conf
ln -sf /etc/nginx/sites-available/get2b.conf /etc/nginx/sites-enabled/get2b.conf
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# SSL certificate (skip if already exists)
if [ ! -f /etc/letsencrypt/live/get2b.pro/fullchain.pem ]; then
  echo -e "${YELLOW}Obtaining SSL certificate...${NC}"
  certbot --nginx -d get2b.pro -d www.get2b.pro --non-interactive --agree-tos --email admin@get2b.pro
else
  echo -e "${GREEN}SSL certificate already exists${NC}"
  certbot renew --dry-run
fi

# Certbot auto-renewal cron
echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'" | crontab -l 2>/dev/null | cat - | sort -u | crontab -

systemctl enable nginx
systemctl restart nginx

# --- Health check cron ---
echo -e "${YELLOW}Setting up health check cron...${NC}"
chmod +x /var/www/godplis/scripts/healthcheck-notify.sh
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/godplis/scripts/healthcheck-notify.sh") | sort -u | crontab -

# --- Summary ---
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Server setup complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Clone repo:  cd /var/www && git clone <repo-url> godplis"
echo "  2. Create .env:  cp /var/www/godplis/.env.example /var/www/godplis/.env"
echo "  3. Fill .env with production values"
echo "  4. Start app:  cd /var/www/godplis && docker compose up -d --build"
echo "  5. Verify:  curl https://get2b.pro/api/health"
echo ""
echo "Maintenance commands:"
echo "  Logs:     docker compose -f /var/www/godplis/docker-compose.yml logs -f --tail=100"
echo "  Restart:  docker compose -f /var/www/godplis/docker-compose.yml restart"
echo "  Status:   docker compose -f /var/www/godplis/docker-compose.yml ps"
echo "  fail2ban: fail2ban-client status sshd"
