import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app';
import { initDatabase, pool } from '../../src/config/database';

const app = buildApp();

describe('Resource API integration', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('GET /health - should return healthy or degraded', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(['healthy', 'degraded']).toContain(body.status);
  });

  it('POST /api/v1/resources then GET list', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/resources',
      payload: { title: 'Test Resource', description: 'Test Description' },
    });
    expect(create.statusCode).toBe(201);
    const created = JSON.parse(create.payload);
    expect(created.success).toBe(true);
    expect(created.data.title).toBe('Test Resource');

    const list = await app.inject({ method: 'GET', url: '/api/v1/resources' });
    expect(list.statusCode).toBe(200);
    const listed = JSON.parse(list.payload);
    expect(listed.success).toBe(true);
    expect(Array.isArray(listed.data)).toBe(true);
  });
});
