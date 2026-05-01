# Jenkins Credentials Setup

After Jenkins is running, add these credentials via the UI:

**Jenkins → Manage Jenkins → Credentials → System → Global credentials (unrestricted) → Add Credentials**

## 1. GHCR Token (for pushing images)

- **Kind:** Username with password
- **ID:** `ghcr-token`
- **Username:** `alexboyev`  ← your GitHub username (lowercase)
- **Password:** `<your GitHub PAT>`  ← token with `write:packages` scope
- **Description:** GitHub Container Registry token

## 2. GitHub Bot Token (for updating kustomization.yaml)

- **Kind:** Secret text
- **ID:** `github-bot-token`
- **Secret:** `<same GitHub PAT>`
- **Description:** GitHub PAT for GitOps repo commits

## Required PAT Scopes

Go to https://github.com/settings/tokens → Generate new token (classic):
- `repo` (full repository access)
- `write:packages` (push to GHCR)

## Webhook (optional)

To auto-trigger builds on push:
- Repo → Settings → Webhooks → Add webhook
- Payload URL: `http://<minikube-ip>:32000/github-webhook/`
- Content type: `application/json`
- Events: **Just the push event**

Note: Minikube IP changes on restart — use ngrok or a static tunnel for stable webhooks.
