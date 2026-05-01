# GitHub Setup for CI/CD

## 1. Push your code to GitHub

```bash
# Verify remote
git remote -v
# Should show: origin https://github.com/AlexBoyev/OmniMind.git

# If not set:
git remote add origin https://github.com/AlexBoyev/OmniMind.git

# Push all commits
git push -u origin main
```

## 2. Create a Personal Access Token (PAT)

1. Go to: https://github.com/settings/tokens
2. **Generate new token (classic)**
3. Scopes needed:
   - ✅ `repo` (full repository access)
   - ✅ `write:packages` (push images to GHCR)
4. Copy the token — **you won't see it again**

## 3. Make GHCR images public (recommended for Minikube)

So Minikube can pull images without imagePullSecrets:

1. Go to: https://github.com/AlexBoyev?tab=packages
2. Click `omnimind-backend` → Package settings → **Change visibility** → Public
3. Repeat for `omnimind-frontend`

## 4. Configure Jenkins credentials

See `jenkins/CREDENTIALS.md` for step-by-step instructions.

Summary:
- `ghcr-token` — Username with password (your GitHub username + PAT)
- `github-bot-token` — Secret text (same PAT, for git commits)

## 5. Configure Jenkins webhook (optional)

To auto-trigger builds on every push:

1. GitHub repo → **Settings → Webhooks → Add webhook**
2. Payload URL: `http://<minikube-ip>:32000/github-webhook/`
3. Content type: `application/json`
4. Events: **Just the push event**
5. Active: ✅

> **Note:** Minikube IP changes on restart. For stable webhooks, use ngrok:
> ```bash
> ngrok http $(minikube ip):32000
> # Use the ngrok URL as the webhook payload URL
> ```

## 6. Configure ArgoCD repository access

ArgoCD needs read access to your repo. Add via configure-argocd.sh:

```bash
export GITHUB_USERNAME=alexboyev
export GITHUB_TOKEN=<your-PAT>
bash scripts/configure-argocd.sh
```

Or via ArgoCD UI: **Settings → Repositories → Connect Repo**
- Type: HTTPS
- URL: `https://github.com/AlexBoyev/OmniMind.git`
- Username: `alexboyev`
- Password: `<PAT>`

## 7. Branch protection (recommended)

Protect the `main` branch:
1. Repo → Settings → Branches → Add rule
2. Branch name pattern: `main`
3. ✅ Require status checks to pass before merging
4. ✅ Require pull request reviews before merging
