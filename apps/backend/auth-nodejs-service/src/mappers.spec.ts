import { normalizeClaims } from './mappers';

describe('normalizeClaims', () => {
  it('normalizes generic', () => {
    const claims = {
      sub: '123',
      email: 'a@b.com',
      email_verified: true,
      preferred_username: 'alice',
      roles: ['user'],
    };
    const user = normalizeClaims('generic', claims);
    expect(user).toEqual(
      expect.objectContaining({
        sub: '123',
        email: 'a@b.com',
        username: 'alice',
        roles: ['user'],
        provider: 'generic',
      })
    );
  });

  it('normalizes cognito', () => {
    const claims = {
      sub: 's',
      email: 'e',
      email_verified: true,
      'cognito:username': 'u',
      'cognito:groups': ['g1', 'g2'],
    };
    const user = normalizeClaims('cognito', claims);
    expect(user.username).toBe('u');
    expect(user.roles).toEqual(['g1', 'g2']);
    expect(user.provider).toBe('cognito');
  });

  it('normalizes keycloak roles from realm and clients', () => {
    const claims = {
      sub: 's',
      preferred_username: 'u',
      realm_access: { roles: ['r1'] },
      resource_access: {
        app1: { roles: ['a1'] },
        app2: { roles: ['a2', 'a3'] },
      },
    };
    const user = normalizeClaims('keycloak', claims);
    expect(user.roles).toEqual(['r1', 'a1', 'a2', 'a3']);
  });
});
