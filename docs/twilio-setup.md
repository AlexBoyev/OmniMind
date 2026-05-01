# Twilio WhatsApp Sandbox Setup

## 1. Create a Twilio account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your phone number

## 2. Get your credentials

From the Twilio Console dashboard:
- `Account SID` → set as `TWILIO_ACCOUNT_SID` in `.env`
- `Auth Token` → set as `TWILIO_AUTH_TOKEN` in `.env`

## 3. Set up WhatsApp Sandbox

1. Go to: Messaging → Try it out → Send a WhatsApp message
2. Follow the instructions to join the sandbox:
   - Send the join code (e.g. `join <word>-<word>`) to `+1 415 523 8886` on WhatsApp
3. The sandbox number is `+14155238886` — this is already the default in `.env`

## 4. Configure the webhook

You need a public URL for Twilio to call when messages arrive.

### Local development with ngrok

```bash
# Start your backend
docker compose up -d

# In another terminal, expose the backend
ngrok http 8000

# Copy the https URL (e.g. https://abc123.ngrok.io)
```

Then in Twilio Console:
1. Messaging → Settings → WhatsApp Sandbox Settings
2. "When a message comes in" → `https://abc123.ngrok.io/api/v1/webhooks/whatsapp`
3. Method: HTTP POST
4. Save

## 5. Link a user account

1. Login to OmniMind at http://localhost:3000
2. Call the link token endpoint:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/me/whatsapp/link-token \
     -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r .token)
   ```
3. Send `link <TOKEN>` via WhatsApp to the sandbox number
4. You should receive: `✅ Your WhatsApp is now linked to OmniMind!`

## 6. Test it

Send any message to the sandbox number — Jarvis will reply!

## Troubleshooting

- **No reply**: Check that ngrok is running and the webhook URL is correct
- **"Invalid or expired link token"**: Generate a new token (they expire on server restart)
- **"Twilio not configured"**: Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in `.env`
