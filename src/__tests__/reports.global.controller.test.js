import request from 'supertest';
import bcrypt from 'bcryptjs';
import pool from '../db/connection.js';
import app from './helpers/testApp.js';
import { setupDB, truncateAll } from './helpers/setupTestDB.js';

// Helper para crear usuarios
async function seedUser({ email, password, role = 'padre', is_active = true, description = null, name = 'User', last = 'Test' }) {
  const hash = await bcrypt.hash(password, 10);
  const res = await pool.query(`
    INSERT INTO "User"(name, last_name, email, phone, password, role, is_active, description)
    VALUES ($1, $2, $3, '+502000', $4, $5, $6, $7)
    RETURNING id
  `, [name, last, email, hash, role, is_active, description]);
  return res.rows[0].id;
}

// Helper para crear un kid
async function seedKid(parent_id, name = 'Kid', last_name = 'Test', birth_date = '2015-01-01') {
  const res = await pool.query(`
    INSERT INTO Kid(parent_id, name, last_name, birth_date)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [parent_id, name, last_name, birth_date]);
  return res.rows[0].id;
}

// Helper para crear un curso
async function seedCourse(name = 'Piano Básico', modality = 'presencial', hourly_rate = 100) {
  const res = await pool.query(`
    INSERT INTO Course(name, description, modality, hourly_rate)
    VALUES ($1, 'Curso de prueba', $2, $3)
    RETURNING id
  `, [name, modality, hourly_rate]);
  return res.rows[0].id;
}

// Helper para crear un schedule
async function seedSchedule(course_id, teacher_id, schedule_date = '2025-11-15', start_time = '10:00', end_time = '11:00') {
  const res = await pool.query(`
    INSERT INTO Schedule(course_id, teacher_id, schedule_date, start_time, end_time)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [course_id, teacher_id, schedule_date, start_time, end_time]);
  return res.rows[0].id;
}

// Helper para crear un booking
async function seedBooking(user_id, kid_id, course_id, schedule_id, teacher_id, modality = 'presencial', status = 'completada') {
  const res = await pool.query(`
    INSERT INTO Booking(user_id, kid_id, course_id, schedule_id, teacher_id, modality, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [user_id, kid_id, course_id, schedule_id, teacher_id, modality, status]);
  return res.rows[0].id;
}

// Helper para crear un payment
async function seedPayment(parent_id, amount, payment_method = 'efectivo', status = 'aceptado', transaction_date = '2025-11-10') {
  const res = await pool.query(`
    INSERT INTO Payment(parent_id, amount, payment_method, status, transaction_date)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [parent_id, amount, payment_method, status, transaction_date]);
  return res.rows[0].id;
}

// Helper para crear un payment_item
async function seedPaymentItem(payment_id, booking_id, amount) {
  const res = await pool.query(`
    INSERT INTO Payment_item(payment_id, booking_id, amount)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [payment_id, booking_id, amount]);
  return res.rows[0].id;
}

beforeAll(async () => {
  await setupDB();
});

beforeEach(async () => {
  await truncateAll();
});

describe('GET /api/admin/reports/kpis', () => {
  test('debe retornar KPIs globales para admin autenticado', async () => {
    // Crear admin
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    // Crear datos de prueba
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Pass123*', role: 'maestro' });
    const parentId = await seedUser({ email: 'parent@ema.test', password: 'Pass123*', role: 'padre' });
    const kidId = await seedKid(parentId);
    const courseId = await seedCourse('Piano', 'presencial', 100);
    const scheduleId = await seedSchedule(courseId, teacherId, '2025-11-10');
    const bookingId = await seedBooking(parentId, kidId, courseId, scheduleId, teacherId, 'presencial', 'completada');
    const paymentId = await seedPayment(parentId, 100, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, bookingId, 100);

    // Login
    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    expect(login.status).toBe(200);

    // Obtener KPIs
    const res = await request(app)
      .get('/api/admin/reports/kpis')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('students');
    expect(res.body).toHaveProperty('teachers');
    expect(res.body).toHaveProperty('completed');
    expect(res.body).toHaveProperty('revenue');
    expect(Number(res.body.students)).toBeGreaterThanOrEqual(1);
    expect(Number(res.body.teachers)).toBeGreaterThanOrEqual(1);
    expect(Number(res.body.completed)).toBeGreaterThanOrEqual(1);
    expect(Number(res.body.revenue)).toBeGreaterThanOrEqual(100);
  });

  test('debe retornar 401 sin autenticación', async () => {
    const res = await request(app)
      .get('/api/admin/reports/kpis')
      .send();

    expect(res.status).toBe(401);
  });

  test('debe filtrar KPIs por rango de fechas', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/kpis?from=2025-11-01&to=2025-11-30')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('students');
  });
});

describe('GET /api/admin/reports/trends/students', () => {
  test('debe retornar tendencia de estudiantes para admin', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const parentId = await seedUser({ email: 'parent@ema.test', password: 'Pass123*', role: 'padre' });
    await seedKid(parentId, 'Student1', 'Test', '2015-01-01');

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/trends/students?granularity=month')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('debe soportar granularidad semanal', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/trends/students?granularity=week')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/admin/reports/distribution/courses', () => {
  test('debe retornar distribución de cursos para admin', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Pass123*', role: 'maestro' });
    const parentId = await seedUser({ email: 'parent@ema.test', password: 'Pass123*', role: 'padre' });
    const kidId = await seedKid(parentId);
    const courseId = await seedCourse('Piano', 'presencial', 100);
    const scheduleId = await seedSchedule(courseId, teacherId, '2025-11-10');
    await seedBooking(parentId, kidId, courseId, scheduleId, teacherId, 'presencial', 'completada');

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/distribution/courses')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('courseName');
      expect(res.body[0]).toHaveProperty('modality');
      expect(res.body[0]).toHaveProperty('students');
    }
  });
});

describe('GET /api/admin/reports/performance/evolution', () => {
  test('debe retornar evolución de rendimiento para admin', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Pass123*', role: 'maestro' });
    const parentId = await seedUser({ email: 'parent@ema.test', password: 'Pass123*', role: 'padre' });
    const kidId = await seedKid(parentId);
    const courseId = await seedCourse('Piano', 'presencial', 100);
    const scheduleId = await seedSchedule(courseId, teacherId, '2025-11-10', '10:00', '11:00');
    await seedBooking(parentId, kidId, courseId, scheduleId, teacherId, 'presencial', 'completada');

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/performance/evolution?granularity=month')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/admin/reports/teachers/performance', () => {
  test('debe retornar rendimiento de maestros para admin', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Pass123*', role: 'maestro', name: 'Juan', last: 'Pérez' });
    const parentId = await seedUser({ email: 'parent@ema.test', password: 'Pass123*', role: 'padre' });
    const kidId = await seedKid(parentId);
    const courseId = await seedCourse('Piano', 'presencial', 100);
    const scheduleId = await seedSchedule(courseId, teacherId, '2025-11-10', '10:00', '11:00');
    await seedBooking(parentId, kidId, courseId, scheduleId, teacherId, 'presencial', 'completada');

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/teachers/performance')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('teacherName');
      expect(res.body[0]).toHaveProperty('classes');
      expect(res.body[0]).toHaveProperty('hours');
    }
  });
});

describe('GET /api/admin/reports/courses/performance', () => {
  test('debe retornar rendimiento de cursos para admin', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Pass123*', role: 'maestro' });
    const parentId = await seedUser({ email: 'parent@ema.test', password: 'Pass123*', role: 'padre' });
    const kidId = await seedKid(parentId);
    const courseId = await seedCourse('Piano', 'presencial', 100);
    const scheduleId = await seedSchedule(courseId, teacherId, '2025-11-10', '10:00', '11:00');
    await seedBooking(parentId, kidId, courseId, scheduleId, teacherId, 'presencial', 'completada');

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/courses/performance')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('courseName');
      expect(res.body[0]).toHaveProperty('classes');
      expect(res.body[0]).toHaveProperty('hours');
    }
  });
});

describe('GET /api/admin/reports/payments/summary', () => {
  test('debe retornar resumen de pagos para admin', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const parentId = await seedUser({ email: 'parent@ema.test', password: 'Pass123*', role: 'padre' });
    const paymentId = await seedPayment(parentId, 500, 'efectivo', 'aceptado', '2025-11-10');

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/payments/summary')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('byMethod');
    expect(res.body).toHaveProperty('trend');
    expect(Number(res.body.total)).toBeGreaterThanOrEqual(0);
  });
});

describe('GET /api/admin/reports/students/top', () => {
  test('debe retornar top estudiantes por horas completadas', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Pass123*', role: 'maestro' });
    const parentId = await seedUser({ email: 'parent@ema.test', password: 'Pass123*', role: 'padre' });
    const kidId = await seedKid(parentId, 'Student', 'TopTest');
    const courseId = await seedCourse('Piano', 'presencial', 100);
    const scheduleId = await seedSchedule(courseId, teacherId, '2025-11-10', '10:00', '11:00');
    await seedBooking(parentId, kidId, courseId, scheduleId, teacherId, 'presencial', 'completada');

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/students/top?metric=hours&limit=10')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('debe retornar top estudiantes por clases completadas', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/students/top?metric=completed&limit=5')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/admin/reports/students/at-risk', () => {
  test('debe retornar estudiantes en riesgo para admin', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Pass123*', role: 'maestro' });
    const parentId = await seedUser({ email: 'parent@ema.test', password: 'Pass123*', role: 'padre' });
    const kidId = await seedKid(parentId);
    const courseId = await seedCourse('Piano', 'presencial', 100);
    const scheduleId1 = await seedSchedule(courseId, teacherId, '2025-11-10', '10:00', '11:00');
    const scheduleId2 = await seedSchedule(courseId, teacherId, '2025-11-11', '10:00', '11:00');
    await seedBooking(parentId, kidId, courseId, scheduleId1, teacherId, 'presencial', 'cancelada');
    await seedBooking(parentId, kidId, courseId, scheduleId2, teacherId, 'presencial', 'cancelada');

    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    
    const res = await request(app)
      .get('/api/admin/reports/students/at-risk?minMissed=2&minDebt=0')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
