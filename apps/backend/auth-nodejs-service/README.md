# auth-nodejs-service

Fastify microservice that verifies JWTs via OIDC discovery and exposes a protected /whoami endpoint returning normalized user claims.

## Run

- Development (hot reload): npx nx run auth-nodejs-service:dev
- Build: npx nx build auth-nodejs-service
- Serve built: npx nx serve auth-nodejs-service

## Environment variables

- AUTH_PROVIDER: generic | cognito | keycloak (default: generic)
- OIDC_ISSUER: required. e.g.
  - Cognito: https://cognito-idp.<region>.amazonaws.com/<userPoolId>
  - Keycloak: https://<host>/realms/<realm>
- OIDC_AUDIENCE: expected aud claim (optional if client id is used)
- OIDC_CLIENT_ID: expected audience when tokens set aud to client id
- OIDC_JWKS_URI: override JWKS URL if needed
- OIDC_CLOCK_TOLERANCE: seconds (default 5)
- PORT: default 3001

## Endpoints

- GET /health — public
- GET /whoami — protected; requires Authorization: Bearer <JWT>

## Notes

- Provider-specific claim mappers produce a NormalizedUser shape, so the API remains constant across providers. Switch providers by changing AUTH_PROVIDER and other env vars; no code changes required.
