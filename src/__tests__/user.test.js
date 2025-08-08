import { describe, test, expect } from 'bun:test';
import request from 'supertest';
import app from '../server.js';

const adminCreds = { email: 'admin@ema.test', password: 'admin123' };
const teacherCreds = { email: 'marco@ema.test', password: 'maestro123' };

describe('Pruebas de usuarios', () => {
  test('1. Actualizar datos propios', async () => {
    const loginRes = await request(app).post('/api/auth/login').send(adminCreds);
    const token = loginRes.body.token;
    const id = loginRes.body.user.id;

    const res = await request(app)
      .patch(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+50211111112' });

    expect(res.status).toBe(200);
    expect(res.body.user.phone).toBe('+50211111112');
  });

  test('2. Descripción no permitida para roles distintos a maestro', async () => {
    const loginRes = await request(app).post('/api/auth/login').send(adminCreds);
    const token = loginRes.body.token;
    const id = loginRes.body.user.id;

    const res = await request(app)
      .patch(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No debería' });

    expect(res.status).toBe(400);
  });

  test('3. Activar y desactivar usuario', async () => {
    const adminLogin = await request(app).post('/api/auth/login').send(adminCreds);
    const adminToken = adminLogin.body.token;

    const teacherLogin = await request(app).post('/api/auth/login').send(teacherCreds);
    const teacherId = teacherLogin.body.user.id;

    // desactivar
    const deact = await request(app)
      .patch(`/api/users/${teacherId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deact.status).toBe(200);
    expect(deact.body.user.is_active).toBe(false);

    // login maestro debería fallar
    const loginFail = await request(app).post('/api/auth/login').send(teacherCreds);
    expect(loginFail.status).toBe(403);

    // activar
    const act = await request(app)
      .patch(`/api/users/${teacherId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(act.status).toBe(200);
    expect(act.body.user.is_active).toBe(true);
  });
});
