#!/bin/bash
set -e

if [ ! -f .env ]; then
  echo "Error: .env not found. Run Phase 4 first."
  exit 1
fi

# Source .env safely (handles values with spaces)
while IFS= read -r line; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    [[ "$line" =~ ^([^=]+)=(.*)$ ]] || continue
    key="${BASH_REMATCH[1]}"
    val="${BASH_REMATCH[2]}"
    export "$key"="$val"
done < .env

# Create the Secret YAML in memory
# --scope cluster-wide: allows the same SealedSecret to work across namespaces
# (required when kustomize overlays change the namespace via namePrefix/namespace)
cat <<EOF | kubeseal --format yaml --scope cluster-wide > k8s/base/secrets.sealed.yaml
apiVersion: v1
kind: Secret
metadata:
  name: omnimind-secrets
  namespace: omnimind
type: Opaque
stringData:
  POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}"
  DATABASE_URL: "${DATABASE_URL}"
  REDIS_PASSWORD: "${REDIS_PASSWORD}"
  REDIS_URL: "${REDIS_URL}"
  SECRET_KEY: "${SECRET_KEY}"
  SEED_ADMIN_PASSWORD: "${SEED_ADMIN_PASSWORD}"
  SEED_USER_PASSWORD: "${SEED_USER_PASSWORD}"
EOF

echo "✅ Sealed secret created at k8s/base/secrets.sealed.yaml"
echo "This file is safe to commit — it's encrypted and can only be decrypted by the cluster."
