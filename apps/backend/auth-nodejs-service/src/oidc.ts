import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

export type OIDCConfig = {
  issuer: string; // base issuer URL, e.g. https://cognito-idp.<region>.amazonaws.com/<poolId> or https://keycloak.example/auth/realms/myrealm
  audience?: string; // expected aud
  clientId?: string; // sometimes tokens have aud=client id
  jwksUri?: string; // optional override
  clockTolerance?: number; // seconds
};

export async function discover(config: OIDCConfig) {
  const wellKnown = config.issuer.replace(/\/$/, '') + '/.well-known/openid-configuration';
  const res = await fetch(wellKnown);
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
  const data = await res.json();
  const jwksUri = config.jwksUri ?? data.jwks_uri;
  if (!jwksUri) throw new Error('jwks_uri missing in OIDC discovery');
  const JWKS = createRemoteJWKSet(new URL(jwksUri));
  return { JWKS, issuer: data.issuer ?? config.issuer };
}

export async function verifyJwt(token: string, opts: { JWKS: ReturnType<typeof createRemoteJWKSet>; issuer: string; audience?: string; clientId?: string; clockTolerance?: number; }) {
  const { JWKS, issuer, audience, clientId, clockTolerance } = opts;
  const expectedAud = audience ?? clientId;
  const result = await jwtVerify(token, JWKS, {
    issuer,
    audience: expectedAud,
    clockTolerance: clockTolerance ?? 5,
  });
  return result.payload as JWTPayload;
}
