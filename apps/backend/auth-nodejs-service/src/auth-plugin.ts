import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';
import { discover, verifyJwt, OIDCConfig } from './oidc';
import { normalizeClaims } from './mappers';
import { Provider } from './types';

export type AuthEnv = {
  OIDC_ISSUER: string;
  OIDC_AUDIENCE?: string;
  OIDC_CLIENT_ID?: string;
  OIDC_JWKS_URI?: string;
  OIDC_CLOCK_TOLERANCE?: string; // seconds
  AUTH_PROVIDER?: Provider; // 'cognito' | 'keycloak' | 'generic'
};

export const authPlugin: FastifyPluginCallback<{ env?: Partial<AuthEnv> }> = fp(
  async (fastify, opts, done) => {
    const env = { ...process.env, ...(opts.env ?? {}) } as any as AuthEnv;
    const provider: Provider = (env.AUTH_PROVIDER as Provider) ?? 'generic';

    if (!env.OIDC_ISSUER) {
      fastify.log.error('OIDC_ISSUER is required');
      throw new Error('OIDC_ISSUER is required');
    }

    const config: OIDCConfig = {
      issuer: env.OIDC_ISSUER,
      audience: env.OIDC_AUDIENCE,
      clientId: env.OIDC_CLIENT_ID,
      jwksUri: env.OIDC_JWKS_URI,
      clockTolerance: env.OIDC_CLOCK_TOLERANCE ? parseInt(env.OIDC_CLOCK_TOLERANCE, 10) : 5,
    };

    const { JWKS, issuer } = await discover(config);

    fastify.decorateRequest('user', null);

    fastify.addHook('onRequest', async (req, reply) => {
      if (req.routerPath === '/health' || req.routerPath === '/') return; // public endpoints
      const auth = req.headers['authorization'] || req.headers['Authorization'];
      if (!auth || Array.isArray(auth)) {
        reply.code(401).send({ message: 'Missing Authorization header' });
        return;
      }
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (!m) {
        reply.code(401).send({ message: 'Invalid Authorization header' });
        return;
      }
      try {
        const payload = await verifyJwt(m[1], {
          JWKS,
          issuer,
          audience: config.audience,
          clientId: config.clientId,
          clockTolerance: config.clockTolerance,
        });
        const normalized = normalizeClaims(provider, payload);
        (req as any).user = normalized;
      } catch (e: any) {
        req.log.warn({ err: e }, 'JWT verification failed');
        reply.code(401).send({ message: 'Unauthorized' });
      }
    });

    // whoami route
    fastify.get('/whoami', async (req, reply) => {
      const user = (req as any).user;
      if (!user) return reply.code(401).send({ message: 'Unauthorized' });
      return user;
    });

    // simple public health
    fastify.get('/health', async () => ({ status: 'ok' }));

    done();
  },
  {
    name: 'auth-plugin',
  }
);

declare module 'fastify' {
  interface FastifyRequest {
    user?: ReturnType<typeof normalizeClaims>;
  }
}
