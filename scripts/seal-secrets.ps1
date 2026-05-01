$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env")) {
    Write-Error "Error: .env not found. Run Phase 4 first."
    exit 1
}

# Load .env into environment
Get-Content ".env" | Where-Object { $_ -match "^\s*[^#]" -and $_ -match "=" } | ForEach-Object {
    $parts = $_ -split "=", 2
    [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
}

$POSTGRES_PASSWORD = [System.Environment]::GetEnvironmentVariable("POSTGRES_PASSWORD")
$DATABASE_URL      = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
$REDIS_PASSWORD    = [System.Environment]::GetEnvironmentVariable("REDIS_PASSWORD")
$REDIS_URL         = [System.Environment]::GetEnvironmentVariable("REDIS_URL")
$SECRET_KEY        = [System.Environment]::GetEnvironmentVariable("SECRET_KEY")
$SEED_ADMIN_PW     = [System.Environment]::GetEnvironmentVariable("SEED_ADMIN_PASSWORD")
$SEED_USER_PW      = [System.Environment]::GetEnvironmentVariable("SEED_USER_PASSWORD")

$secretYaml = @"
apiVersion: v1
kind: Secret
metadata:
  name: omnimind-secrets
  namespace: omnimind
type: Opaque
stringData:
  POSTGRES_PASSWORD: "$POSTGRES_PASSWORD"
  DATABASE_URL: "$DATABASE_URL"
  REDIS_PASSWORD: "$REDIS_PASSWORD"
  REDIS_URL: "$REDIS_URL"
  SECRET_KEY: "$SECRET_KEY"
  SEED_ADMIN_PASSWORD: "$SEED_ADMIN_PW"
  SEED_USER_PASSWORD: "$SEED_USER_PW"
"@

$secretYaml | kubeseal --format yaml | Out-File -Encoding utf8 "k8s\base\secrets.sealed.yaml"

Write-Host "✅ Sealed secret created at k8s/base/secrets.sealed.yaml" -ForegroundColor Green
Write-Host "This file is safe to commit — it's encrypted and can only be decrypted by the cluster." -ForegroundColor Green
