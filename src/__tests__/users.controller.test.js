import request from 'supertest';
import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import app from './helpers/testApp.js';
import { setupDB, truncateAll } from './helpers/setupTestDB.js';

async function seedUser({ email, password, role = 'padre', is_active = true, description = null, name='User', last='Test' }) {
  const hash = await bcrypt.hash(password, 10);
  const res = await db.query(`
    INSERT INTO "User"(name,last_name,email,phone,password,role,is_active,description)
    VALUES ($1,$2,$3,'+502000',$4,$5,$6,$7)
    RETURNING id
  `, [name, last, email, hash, role, is_active, description]);
  return res.rows[0].id;
}

beforeAll(async () => {
  await setupDB();
});

beforeEach(async () => {
  await truncateAll();
});

test('update self (padre) sin description', async () => {
  const email = 'parent@ema.test';
  const pass = 'Parent123*';
  const id = await seedUser({ email, password: pass, role: 'padre' });

  const login = await request(app).post('/api/auth/login').send({ email, password: pass });
  expect(login.status).toBe(200);

  const res = await request(app)
    .patch(`/api/users/${id}`)
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({ name: 'ParentRenamed' });

  expect(res.status).toBe(200);
  expect(res.body?.user?.name).toBe('ParentRenamed');
});

test('update maestro con description permitido', async () => {
  const email = 'teacher@ema.test';
  const pass = 'Teacher123*';
  const id = await seedUser({ email, password: pass, role: 'maestro' });

  const login = await request(app).post('/api/auth/login').send({ email, password: pass });
  expect(login.status).toBe(200);

  const res = await request(app)
    .patch(`/api/users/${id}`)
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({ description: 'Profesor de piano' });

  expect(res.status).toBe(200);
  expect(res.body?.user?.description).toBe('Profesor de piano');
});

test('activate/deactivate requiere admin y cambia is_active', async () => {
  const adminEmail = 'admin@ema.test';
  const adminPass = 'Admin123*';
  await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

  const userEmail = 'user@ema.test';
  const userPass = 'User123*';
  const userId = await seedUser({ email: userEmail, password: userPass, role: 'padre' });

  const loginAdmin = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
  expect(loginAdmin.status).toBe(200);

  const deac = await request(app)
    .patch(`/api/users/${userId}/deactivate`)
    .set('Authorization', `Bearer ${loginAdmin.body.token}`)
    .send();
  expect(deac.status).toBe(200);
  expect(deac.body?.user?.is_active).toBe(false);

  const ac = await request(app)
    .patch(`/api/users/${userId}/activate`)
    .set('Authorization', `Bearer ${loginAdmin.body.token}`)
    .send();
  expect(ac.status).toBe(200);
  expect(ac.body?.user?.is_active).toBe(true);
});