# GitOps Flow

## How it works

```
Developer push
      │
      ▼
  GitHub repo
      │
      ├─► Jenkins (CI)
      │         │
      │    lint → test → build → push images → update kustomization.yaml
      │                                               │
      │                                         git push
      │                                               │
      ▼                                               ▼
  GitHub repo ◄──────────────────────── auto-commit image tag
      │
      ▼
  ArgoCD (CD)
      │
   detects diff
      │
      ▼
  kubectl apply
      │
      ▼
 Pods roll out
```

### Step by step

1. Developer pushes code to GitHub (any branch)
2. Jenkins detects push via webhook (or manual scan)
3. Jenkins runs: **lint → test → build → push images to GHCR**
4. Jenkins updates `k8s/overlays/staging/kustomization.yaml` with the new image tag
5. Jenkins commits and pushes the change back to GitHub
6. ArgoCD polls GitHub every 3 minutes and detects the changed file
7. ArgoCD syncs the cluster (pulls new images, performs rolling deployment)
8. **Done** — staging is automatically updated with zero downtime

## Environments

| Environment | Namespace | Trigger | Approval |
|-------------|-----------|---------|----------|
| staging | omnimind-staging | Auto (every push to main) | None |
| production | omnimind-production | Manual | Required |

## Promoting to production

**Option A — PR approach (recommended):**
1. Open a PR that bumps `k8s/overlays/production/kustomization.yaml` newTag
2. Get review approval
3. Merge PR → ArgoCD auto-syncs production

**Option B — ArgoCD UI:**
1. Open ArgoCD → omnimind-production app
2. Click **Sync** → **Synchronize**
3. Pods roll in omnimind-production namespace

**Option C — CLI:**
```bash
argocd app sync omnimind-production
```

## Rolling back

```bash
# Revert the kustomization.yaml commit
git revert HEAD
git push origin main
# ArgoCD auto-syncs within 3 minutes → old version restored
```

Or via ArgoCD UI: **App → History → Click old revision → Rollback**

## Useful commands

```bash
# Watch pods rolling out
kubectl get pods -n omnimind-staging -w

# Check ArgoCD app status
argocd app get omnimind-staging
argocd app list

# Force sync
argocd app sync omnimind-staging

# Get build logs
kubectl logs -n jenkins -l app.kubernetes.io/component=jenkins-controller
```
