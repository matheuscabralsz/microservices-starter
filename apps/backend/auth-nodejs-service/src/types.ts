export type NormalizedUser = {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  username?: string;
  roles?: string[];
  provider: 'cognito' | 'keycloak' | 'generic';
  raw: Record<string, unknown>;
};

export type Provider = 'cognito' | 'keycloak' | 'generic';
