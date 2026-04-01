#!/bin/bash
# ===========================================
# GET2B Health Check with Telegram Notification
# Cron: */5 * * * * /var/www/godplis/scripts/healthcheck-notify.sh
# ===========================================

HEALTH_URL="https://get2b.pro/api/health"
STATE_FILE="/tmp/get2b-health-state"

# Load env vars from .env
if [ -f /var/www/godplis/.env ]; then
  export $(grep -E '^(TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' /var/www/godplis/.env | xargs)
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
  echo "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID"
  exit 1
fi

send_telegram() {
  local message="$1"
  curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" \
    -d text="${message}" \
    -d parse_mode=HTML > /dev/null 2>&1
}

# Check health endpoint
HTTP_CODE=$(curl -sf -m 10 -o /tmp/get2b-health-response -w "%{http_code}" "$HEALTH_URL" 2>/dev/null)
EXIT_CODE=$?

PREV_STATE="up"
[ -f "$STATE_FILE" ] && PREV_STATE=$(cat "$STATE_FILE")

if [ $EXIT_CODE -ne 0 ] || [ "$HTTP_CODE" != "200" ]; then
  # Site is DOWN
  echo "down" > "$STATE_FILE"

  if [ "$PREV_STATE" = "up" ]; then
    # Transition: up → down — send alert
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    RESPONSE=$(cat /tmp/get2b-health-response 2>/dev/null | head -c 200)
    send_telegram "🔴 <b>GET2B DOWN</b>
Time: ${TIMESTAMP}
HTTP: ${HTTP_CODE}
Response: ${RESPONSE:-timeout/connection refused}

Check: <code>docker compose -f /var/www/godplis/docker-compose.yml logs --tail=50</code>"
  fi
else
  # Site is UP
  echo "up" > "$STATE_FILE"

  if [ "$PREV_STATE" = "down" ]; then
    # Transition: down → up — send recovery
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    send_telegram "🟢 <b>GET2B RECOVERED</b>
Time: ${TIMESTAMP}
Status: healthy"
  fi
fi

rm -f /tmp/get2b-health-response
