import request from 'supertest';
import bcrypt from 'bcryptjs';
import pool from '../db/connection.js';
import app from './helpers/testApp.js';
import { setupDB, truncateAll } from './helpers/setupTestDB.js';

const TEST_EMAIL = 'john.doe@ema.test';
const TEST_PASS  = 'Secret123*';

beforeAll(async () => {
  await setupDB();
});

beforeEach(async () => {
  await truncateAll();
});

test('register crea usuario padre', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'John',
      last_name: 'Doe',
      phone: '+50212345678',
      email: TEST_EMAIL,
      password: TEST_PASS,
      role: 'padre'
    });

  expect(res.status).toBe(201);
  expect(res.body?.user?.email).toBe(TEST_EMAIL);
});

test('login con credenciales válidas devuelve token', async () => {
  const hash = await bcrypt.hash(TEST_PASS, 10);
  await pool.query(`
    INSERT INTO "User"(name,last_name,email,phone,password,role,is_active)
    VALUES ('John','Doe',$1,'+502123',$2,'padre',true)
  `, [TEST_EMAIL, hash]);

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: TEST_EMAIL, password: TEST_PASS });

  expect(res.status).toBe(200);
  expect(res.body?.token).toBeTruthy();
});

test('update-password cambia contraseña con current válida', async () => {
  const hash = await bcrypt.hash(TEST_PASS, 10);
  const inserted = await pool.query(`
    INSERT INTO "User"(name,last_name,email,phone,password,role,is_active)
    VALUES ('Jane','Doe','jane@ema.test','+502000',$1,'padre',true)
    RETURNING id
  `, [hash]);
  const userId = inserted.rows[0].id;

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'jane@ema.test', password: TEST_PASS });

  expect(login.status).toBe(200);

  const res = await request(app)
    .post('/api/auth/update-password')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      userId,
      currentPassword: TEST_PASS,
      newPassword: 'NewSecret123*'
    });

  expect(res.status).toBe(200);

  const login2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'jane@ema.test', password: 'NewSecret123*' });

  expect(login2.status).toBe(200);
  expect(login2.body.token).toBeTruthy();
});