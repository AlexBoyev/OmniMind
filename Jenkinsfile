pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: docker
    image: docker:24-dind
    securityContext:
      privileged: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run
  - name: python
    image: python:3.12-slim
    command: ["sleep"]
    args: ["infinity"]
  - name: node
    image: node:20-alpine
    command: ["sleep"]
    args: ["infinity"]
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["sleep"]
    args: ["infinity"]
  volumes:
  - name: docker-sock
    emptyDir: {}
      '''
    }
  }

  environment {
    REGISTRY    = 'ghcr.io'
    IMAGE_OWNER = 'alexboyev'
    IMAGE_TAG   = "${env.GIT_COMMIT.take(7)}"
    GHCR_CREDS  = credentials('ghcr-token')
    GIT_BOT_CREDS = credentials('github-bot-token')
  }

  stages {
    stage('Lint Backend') {
      steps {
        container('python') {
          sh '''
            cd backend
            pip install --quiet ruff black mypy bandit
            ruff check .
            black --check .
            mypy app --ignore-missing-imports
            bandit -r app -ll
          '''
        }
      }
    }

    stage('Test Backend') {
      steps {
        container('python') {
          sh '''
            cd backend
            pip install --quiet -r requirements.txt
            DATABASE_URL=sqlite+aiosqlite:///test.db pytest tests/ -v
          '''
        }
      }
    }

    stage('Lint + Build Frontend') {
      steps {
        container('node') {
          sh '''
            cd frontend
            npm ci --quiet
            npm run lint
            npm run build
          '''
        }
      }
    }

    stage('Build & Push Images') {
      when { branch 'master' }
      steps {
        container('docker') {
          sh '''
            echo "$GHCR_CREDS_PSW" | docker login $REGISTRY -u "$GHCR_CREDS_USR" --password-stdin

            docker build -t $REGISTRY/$IMAGE_OWNER/omnimind-backend:$IMAGE_TAG \
              ./backend --target=production
            docker build -t $REGISTRY/$IMAGE_OWNER/omnimind-frontend:$IMAGE_TAG \
              ./frontend --target=production

            docker push $REGISTRY/$IMAGE_OWNER/omnimind-backend:$IMAGE_TAG
            docker push $REGISTRY/$IMAGE_OWNER/omnimind-frontend:$IMAGE_TAG
          '''
        }
      }
    }

    stage('Trivy Scan') {
      when { branch 'master' }
      steps {
        container('docker') {
          sh '''
            docker run --rm aquasec/trivy:latest image \
              --severity HIGH,CRITICAL \
              --exit-code 0 \
              $REGISTRY/$IMAGE_OWNER/omnimind-backend:$IMAGE_TAG
          '''
        }
      }
    }

    stage('Update GitOps Repo') {
      when { branch 'master' }
      steps {
        container('kubectl') {
          sh '''
            apk add --no-cache git sed

            git config --global user.email "jenkins@omnimind.local"
            git config --global user.name "Jenkins Bot"

            git clone https://${GIT_BOT_CREDS_PSW}@github.com/${IMAGE_OWNER}/OmniMind.git repo
            cd repo

            sed -i "s|newTag: .*|newTag: ${IMAGE_TAG}|g" k8s/overlays/staging/kustomization.yaml

            git add k8s/overlays/staging/kustomization.yaml
            git commit -m "ci: bump staging image to ${IMAGE_TAG}" || echo "No changes to commit"
            git push origin main
          '''
        }
      }
    }
  }

  post {
    success {
      echo "✅ Build ${IMAGE_TAG} successful — staging update committed"
    }
    failure {
      echo "❌ Build ${IMAGE_TAG} failed — check stage logs above"
    }
  }
}
