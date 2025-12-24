import request from 'supertest';
import app from '../../src/app.js';

describe('Auth', () => {
  it('registers a user', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'T', email: 't+test@example.com', password: 'secret' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
