#!/bin/bash
set -e

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN is not set"
  echo "  export TELEGRAM_BOT_TOKEN=123456:ABC-DEF..."
  exit 1
fi

if [ -z "$WEBHOOK_URL" ]; then
  echo "Error: WEBHOOK_URL is not set"
  echo "  export WEBHOOK_URL=https://your-domain.com"
  echo "  (For local dev: use ngrok — https://ngrok.com)"
  echo "  Example: export WEBHOOK_URL=https://abc123.ngrok.io"
  exit 1
fi

FULL_URL="${WEBHOOK_URL}/api/v1/webhooks/telegram"

echo "Setting Telegram webhook to: $FULL_URL"
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${FULL_URL}\"}" | python3 -m json.tool

echo ""
echo "✅ Telegram webhook configured"
echo "Test it by messaging your bot on Telegram"
