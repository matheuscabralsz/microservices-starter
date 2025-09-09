# Infrastructure

Primary cloud: AWS. The code should remain cloud-agnostic via Terraform.

## Terraform
- Structure: modular-per-app
- State backend: recommend remote backend (e.g., S3 + DynamoDB lock) — to be configured
- Workspaces: one per environment (`dev`, `prod`)

## CI/CD
- Primary: GitHub Actions
  - Example pipeline ideas:
    - Install deps, restore Nx cache
    - Lint, test, build affected
    - Build and push Docker images
    - Plan/apply Terraform (gated to protected branches)
    - Deploy to environment (Compose or K8s when ready)
- Example: Jenkins
  - Provide a Jenkinsfile illustrating a similar pipeline (later addition)

## Runtime
- Start with Docker Compose for local/dev
- Plan migration to Kubernetes for higher environments
- Kong API Gateway will route traffic to services

## Secrets & Config
- Local: `.env` files (not committed). Provide `.env.example` when adding new vars
- Cloud: use AWS SSM Parameter Store / Secrets Manager

## Networking & Security (high-level)
- Private networks for services; public ingress through Kong (or cloud LB)
- TLS termination at the edge; service-to-service mTLS is a future option
- Least privilege IAM for CI/CD and runtime
