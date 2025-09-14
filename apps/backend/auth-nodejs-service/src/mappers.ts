import { NormalizedUser, Provider } from './types';

export function normalizeClaims(provider: Provider, claims: any): NormalizedUser {
  switch (provider) {
    case 'cognito':
      return normalizeCognito(claims);
    case 'keycloak':
      return normalizeKeycloak(claims);
    default:
      return normalizeGeneric(claims);
  }
}

function normalizeGeneric(c: any): NormalizedUser {
  return {
    sub: c.sub,
    email: c.email,
    emailVerified: c.email_verified ?? c.emailVerified,
    name: c.name,
    givenName: c.given_name ?? c.givenName,
    familyName: c.family_name ?? c.familyName,
    username: c.preferred_username ?? c.username,
    roles: Array.isArray(c.roles) ? c.roles : undefined,
    provider: 'generic',
    raw: c,
  };
}

function normalizeCognito(c: any): NormalizedUser {
  // AWS Cognito often uses 'cognito:username' and email_verified boolean
  const groups = c['cognito:groups'];
  return {
    sub: c.sub,
    email: c.email,
    emailVerified: c.email_verified,
    name: c.name,
    givenName: c.given_name,
    familyName: c.family_name,
    username: c['cognito:username'] ?? c.username,
    roles: Array.isArray(groups) ? groups : undefined,
    provider: 'cognito',
    raw: c,
  };
}

function normalizeKeycloak(c: any): NormalizedUser {
  const resourceAccessRoles = extractKeycloakRoles(c);
  return {
    sub: c.sub,
    email: c.email,
    emailVerified: c.email_verified,
    name: c.name,
    givenName: c.given_name,
    familyName: c.family_name,
    username: c.preferred_username ?? c.username,
    roles: resourceAccessRoles,
    provider: 'keycloak',
    raw: c,
  };
}

function extractKeycloakRoles(c: any): string[] | undefined {
  const roles: string[] = [];
  if (Array.isArray(c.realm_access?.roles)) roles.push(...c.realm_access.roles);
  if (c.resource_access && typeof c.resource_access === 'object') {
    for (const client of Object.values<any>(c.resource_access)) {
      if (Array.isArray(client?.roles)) roles.push(...client.roles);
    }
  }
  return roles.length ? roles : undefined;
}
