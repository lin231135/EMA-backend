import request from 'supertest';
import bcrypt from 'bcryptjs';
import pool from '../db/connection.js';
import app from './helpers/testApp.js';
import { setupDB, truncateAll } from './helpers/setupTestDB.js';

// ==================== HELPERS PARA SEED DE DATOS ====================

async function seedUser({ email, password, role = 'padre', is_active = true, description = null, name = 'User', last = 'Test' }) {
  const hash = await bcrypt.hash(password, 10);
  const res = await pool.query(`
    INSERT INTO "User"(name, last_name, email, phone, password, role, is_active, description)
    VALUES ($1, $2, $3, '+502000', $4, $5, $6, $7)
    RETURNING id
  `, [name, last, email, hash, role, is_active, description]);
  return res.rows[0].id;
}

async function seedKid(parent_id, name = 'Kid', last_name = 'Test', birth_date = '2015-01-01') {
  const res = await pool.query(`
    INSERT INTO Kid(parent_id, name, last_name, birth_date)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [parent_id, name, last_name, birth_date]);
  return res.rows[0].id;
}

async function seedCourse(name = 'Piano Básico', modality = 'presencial', hourly_rate = 100) {
  const res = await pool.query(`
    INSERT INTO Course(name, description, modality, hourly_rate)
    VALUES ($1, 'Curso de prueba', $2, $3)
    RETURNING id
  `, [name, modality, hourly_rate]);
  return res.rows[0].id;
}

async function seedSchedule(course_id, teacher_id, schedule_date = '2025-11-15', start_time = '10:00', end_time = '11:00') {
  const res = await pool.query(`
    INSERT INTO Schedule(course_id, teacher_id, schedule_date, start_time, end_time)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [course_id, teacher_id, schedule_date, start_time, end_time]);
  return res.rows[0].id;
}

async function seedBooking(user_id, kid_id, course_id, schedule_id, teacher_id, modality = 'presencial', status = 'completada') {
  const res = await pool.query(`
    INSERT INTO Booking(user_id, kid_id, course_id, schedule_id, teacher_id, modality, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [user_id, kid_id, course_id, schedule_id, teacher_id, modality, status]);
  return res.rows[0].id;
}

async function seedPayment(user_id, amount, payment_method = 'efectivo', state = 'aceptado', payment_date = '2025-11-10', note = null, admin_note = null, reference_pic = null) {
  const res = await pool.query(`
    INSERT INTO Payment(user_id, total, payment_method, state, payment_date, note, admin_note, reference_pic)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [user_id, amount, payment_method, state, payment_date, note, admin_note, reference_pic]);
  return res.rows[0].id;
}

async function seedPaymentItem(payment_id, booking_id = null, book_id = null, unit_cost = 100, subtotal = 100) {
  const res = await pool.query(`
    INSERT INTO Payment_item(payment_id, booking_id, book_id, unit_cost, subtotal)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [payment_id, booking_id, book_id, unit_cost, subtotal]);
  return res.rows[0].id;
}

async function seedBook(name = 'Test Book', description = 'Book description', cost = 50, stock = 10) {
  const res = await pool.query(`
    INSERT INTO Book(name, description, cost, stock, img_url)
    VALUES ($1, $2, $3, $4, 'https://example.com/book.jpg')
    RETURNING id
  `, [name, description, cost, stock]);
  return res.rows[0].id;
}

async function getAuthToken(email, password) {
  const login = await request(app).post('/api/auth/login').send({ email, password });
  return login.body.token;
}

// ==================== SETUP Y TEARDOWN ====================

beforeAll(async () => {
  await setupDB();
});

beforeEach(async () => {
  await truncateAll();
});

// ==================== TESTS PARA getParentPaymentHistory ====================

describe('GET /api/parent/payments/history', () => {
  test('debe retornar historial de pagos del padre sin filtro de kid', async () => {
    // Crear padre
    const parentEmail = 'parent@ema.test';
    const parentPass = 'Parent123*';
    const parentId = await seedUser({ email: parentEmail, password: parentPass, role: 'padre' });

    // Crear maestro
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    // Crear kid
    const kidId = await seedKid(parentId, 'Juan', 'Pérez');

    // Crear curso y schedule
    const courseId = await seedCourse('Piano Avanzado', 'presencial', 150);
    const scheduleId = await seedSchedule(courseId, teacherId, '2025-11-10');

    // Crear booking
    const bookingId = await seedBooking(parentId, kidId, courseId, scheduleId, teacherId, 'presencial', 'completada');

    // Crear payment y payment_item
    const paymentId = await seedPayment(parentId, 150, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, bookingId, null, 150, 150);

    // Obtener token
    const token = await getAuthToken(parentEmail, parentPass);

    // Request
    const res = await request(app)
      .get('/api/parent/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toHaveProperty('serialNumber');
    expect(res.body.items[0]).toHaveProperty('description');
    expect(res.body.items[0]).toHaveProperty('totalCost');
    expect(res.body.items[0]).toHaveProperty('state');
    expect(res.body.items[0].description).toContain('Piano Avanzado');
  });

  test('debe filtrar historial por kid_id específico', async () => {
    const parentEmail = 'parent@ema.test';
    const parentPass = 'Parent123*';
    const parentId = await seedUser({ email: parentEmail, password: parentPass, role: 'padre' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    // Crear 2 kids
    const kid1Id = await seedKid(parentId, 'Kid1', 'Test');
    const kid2Id = await seedKid(parentId, 'Kid2', 'Test');

    const courseId = await seedCourse('Guitarra', 'presencial', 100);
    const schedule1 = await seedSchedule(courseId, teacherId, '2025-11-10');
    const schedule2 = await seedSchedule(courseId, teacherId, '2025-11-11');

    // Booking para kid1
    const booking1 = await seedBooking(parentId, kid1Id, courseId, schedule1, teacherId);
    // Booking para kid2
    const booking2 = await seedBooking(parentId, kid2Id, courseId, schedule2, teacherId);

    // Pagos
    const payment1 = await seedPayment(parentId, 100, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(payment1, booking1, null, 100, 100);

    const payment2 = await seedPayment(parentId, 100, 'transferencia', 'aceptado', '2025-11-11');
    await seedPaymentItem(payment2, booking2, null, 100, 100);

    const token = await getAuthToken(parentEmail, parentPass);

    // Filtrar solo kid1
    const res = await request(app)
      .get(`/api/parent/payments/history?kid_id=${kid1Id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].description).toContain('Kid1');
  });

  test('debe incluir items de libros cuando no se filtra por kid_id', async () => {
    const parentEmail = 'parent@ema.test';
    const parentPass = 'Parent123*';
    const parentId = await seedUser({ email: parentEmail, password: parentPass, role: 'padre' });

    // Crear un libro
    const bookId = await seedBook('Método Suzuki', 'Libro de piano', 50, 10);

    // Crear payment con item de libro
    const paymentId = await seedPayment(parentId, 50, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, null, bookId, 50, 50);

    const token = await getAuthToken(parentEmail, parentPass);

    const res = await request(app)
      .get('/api/parent/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].description).toContain('Método Suzuki');
  });

  test('debe excluir items de libros cuando se filtra por kid_id', async () => {
    const parentEmail = 'parent@ema.test';
    const parentPass = 'Parent123*';
    const parentId = await seedUser({ email: parentEmail, password: parentPass, role: 'padre' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    const kidId = await seedKid(parentId, 'Kid', 'Test');
    const courseId = await seedCourse('Piano', 'presencial', 100);
    const scheduleId = await seedSchedule(courseId, teacherId);

    // Booking para el kid
    const bookingId = await seedBooking(parentId, kidId, courseId, scheduleId, teacherId);

    // Libro
    const bookId = await seedBook('Libro Test', 'Descripción', 50, 10);

    // 2 pagos: uno con booking, otro con libro
    const payment1 = await seedPayment(parentId, 100, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(payment1, bookingId, null, 100, 100);

    const payment2 = await seedPayment(parentId, 50, 'efectivo', 'aceptado', '2025-11-11');
    await seedPaymentItem(payment2, null, bookId, 50, 50);

    const token = await getAuthToken(parentEmail, parentPass);

    // Con filtro kid_id, solo debe retornar el item del booking
    const res = await request(app)
      .get(`/api/parent/payments/history?kid_id=${kidId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].description).toContain('Piano');
  });

  test('debe retornar 401 sin autenticación', async () => {
    const res = await request(app)
      .get('/api/parent/payments/history')
      .send();

    expect(res.status).toBe(401);
  });

  test('debe retornar 403 si el usuario no es padre o admin', async () => {
    const studentEmail = 'student@ema.test';
    const studentPass = 'Student123*';
    await seedUser({ email: studentEmail, password: studentPass, role: 'estudiante' });

    const token = await getAuthToken(studentEmail, studentPass);

    const res = await request(app)
      .get('/api/parent/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(403);
  });

  test('debe incluir información del pago (state, method, notes)', async () => {
    const parentEmail = 'parent@ema.test';
    const parentPass = 'Parent123*';
    const parentId = await seedUser({ email: parentEmail, password: parentPass, role: 'padre' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    const kidId = await seedKid(parentId);
    const courseId = await seedCourse('Violín', 'presencial', 200);
    const scheduleId = await seedSchedule(courseId, teacherId);
    const bookingId = await seedBooking(parentId, kidId, courseId, scheduleId, teacherId);

    const paymentId = await seedPayment(
      parentId,
      200,
      'transferencia',
      'aceptado',
      '2025-11-10',
      'Nota del usuario',
      'Nota del admin',
      'https://example.com/receipt.jpg'
    );
    await seedPaymentItem(paymentId, bookingId, null, 200, 200);

    const token = await getAuthToken(parentEmail, parentPass);

    const res = await request(app)
      .get('/api/parent/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items[0].state).toBe('aceptado');
    expect(res.body.items[0].paymentMethod).toBe('transferencia');
    expect(res.body.items[0].userNote).toBe('Nota del usuario');
    expect(res.body.items[0].adminNote).toBe('Nota del admin');
    expect(res.body.items[0].referencePic).toBe('https://example.com/receipt.jpg');
  });

  test('admin puede acceder al historial de pagos de un padre', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    const adminId = await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });
    const kidId = await seedKid(adminId);
    const courseId = await seedCourse('Canto', 'presencial', 120);
    const scheduleId = await seedSchedule(courseId, teacherId);
    const bookingId = await seedBooking(adminId, kidId, courseId, scheduleId, teacherId);

    const paymentId = await seedPayment(adminId, 120, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, bookingId, null, 120, 120);

    const token = await getAuthToken(adminEmail, adminPass);

    const res = await request(app)
      .get('/api/parent/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});

// ==================== TESTS PARA getStudentPaymentHistory ====================

describe('GET /api/students/payments/history', () => {
  test('estudiante puede ver su historial sin kid_id (adulto)', async () => {
    const studentEmail = 'student@ema.test';
    const studentPass = 'Student123*';
    const studentId = await seedUser({ email: studentEmail, password: studentPass, role: 'estudiante' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    const courseId = await seedCourse('Batería', 'presencial', 180);
    const scheduleId = await seedSchedule(courseId, teacherId);

    // Booking sin kid_id (estudiante adulto)
    const bookingId = await seedBooking(studentId, null, courseId, scheduleId, teacherId);

    const paymentId = await seedPayment(studentId, 180, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, bookingId, null, 180, 180);

    const token = await getAuthToken(studentEmail, studentPass);

    const res = await request(app)
      .get('/api/students/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].description).toContain('Batería');
  });

  test('estudiante puede ver historial con kid_id específico', async () => {
    const studentEmail = 'student@ema.test';
    const studentPass = 'Student123*';
    const studentId = await seedUser({ email: studentEmail, password: studentPass, role: 'estudiante' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    // Estudiante con hijo
    const kidId = await seedKid(studentId, 'Child', 'Student');

    const courseId = await seedCourse('Saxofón', 'presencial', 160);
    const scheduleId = await seedSchedule(courseId, teacherId);
    const bookingId = await seedBooking(studentId, kidId, courseId, scheduleId, teacherId);

    const paymentId = await seedPayment(studentId, 160, 'transferencia', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, bookingId, null, 160, 160);

    const token = await getAuthToken(studentEmail, studentPass);

    const res = await request(app)
      .get(`/api/students/payments/history?kid_id=${kidId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].description).toContain('Child');
  });

  test('estudiante no puede ver historial de kid que no le pertenece', async () => {
    const student1Email = 'student1@ema.test';
    const student1Pass = 'Student123*';
    const student1Id = await seedUser({ email: student1Email, password: student1Pass, role: 'estudiante' });

    const student2Email = 'student2@ema.test';
    const student2Pass = 'Student123*';
    const student2Id = await seedUser({ email: student2Email, password: student2Pass, role: 'estudiante' });

    // Kid del student2
    const kid2Id = await seedKid(student2Id, 'OtherKid', 'Test');

    const token = await getAuthToken(student1Email, student1Pass);

    // Student1 intenta acceder al kid de student2
    const res = await request(app)
      .get(`/api/students/payments/history?kid_id=${kid2Id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('does not belong');
  });

  test('padre puede ver historial de su hijo con kid_id', async () => {
    const parentEmail = 'parent@ema.test';
    const parentPass = 'Parent123*';
    const parentId = await seedUser({ email: parentEmail, password: parentPass, role: 'padre' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    const kidId = await seedKid(parentId, 'MyKid', 'Test');

    const courseId = await seedCourse('Trompeta', 'presencial', 140);
    const scheduleId = await seedSchedule(courseId, teacherId);
    const bookingId = await seedBooking(parentId, kidId, courseId, scheduleId, teacherId);

    const paymentId = await seedPayment(parentId, 140, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, bookingId, null, 140, 140);

    const token = await getAuthToken(parentEmail, parentPass);

    const res = await request(app)
      .get(`/api/students/payments/history?kid_id=${kidId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  test('padre necesita enviar kid_id', async () => {
    const parentEmail = 'parent@ema.test';
    const parentPass = 'Parent123*';
    await seedUser({ email: parentEmail, password: parentPass, role: 'padre' });

    const token = await getAuthToken(parentEmail, parentPass);

    const res = await request(app)
      .get('/api/students/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('kid_id');
  });

  test('padre no puede ver historial de kid que no le pertenece', async () => {
    const parent1Email = 'parent1@ema.test';
    const parent1Pass = 'Parent123*';
    await seedUser({ email: parent1Email, password: parent1Pass, role: 'padre' });

    const parent2Email = 'parent2@ema.test';
    const parent2Pass = 'Parent123*';
    const parent2Id = await seedUser({ email: parent2Email, password: parent2Pass, role: 'padre' });

    const kid2Id = await seedKid(parent2Id, 'OtherKid', 'Test');

    const token = await getAuthToken(parent1Email, parent1Pass);

    const res = await request(app)
      .get(`/api/students/payments/history?kid_id=${kid2Id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('do not own');
  });

  test('admin puede ver historial de cualquier kid con kid_id', async () => {
    const adminEmail = 'admin@ema.test';
    const adminPass = 'Admin123*';
    await seedUser({ email: adminEmail, password: adminPass, role: 'admin' });

    const parentEmail = 'parent@ema.test';
    const parentPass = 'Parent123*';
    const parentId = await seedUser({ email: parentEmail, password: parentPass, role: 'padre' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    const kidId = await seedKid(parentId, 'SomeKid', 'Test');

    const courseId = await seedCourse('Flauta', 'presencial', 110);
    const scheduleId = await seedSchedule(courseId, teacherId);
    const bookingId = await seedBooking(parentId, kidId, courseId, scheduleId, teacherId);

    const paymentId = await seedPayment(parentId, 110, 'deposito', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, bookingId, null, 110, 110);

    const token = await getAuthToken(adminEmail, adminPass);

    const res = await request(app)
      .get(`/api/students/payments/history?kid_id=${kidId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  test('debe retornar 401 sin autenticación', async () => {
    const res = await request(app)
      .get('/api/students/payments/history')
      .send();

    expect(res.status).toBe(401);
  });

  test('debe ordenar pagos por fecha descendente', async () => {
    const studentEmail = 'student@ema.test';
    const studentPass = 'Student123*';
    const studentId = await seedUser({ email: studentEmail, password: studentPass, role: 'estudiante' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    const courseId = await seedCourse('Piano', 'presencial', 100);

    // 3 bookings en diferentes fechas
    for (let i = 0; i < 3; i++) {
      const scheduleId = await seedSchedule(courseId, teacherId, `2025-11-${10 + i}`);
      const bookingId = await seedBooking(studentId, null, courseId, scheduleId, teacherId);
      const paymentId = await seedPayment(studentId, 100, 'efectivo', 'aceptado', `2025-11-${10 + i}`);
      await seedPaymentItem(paymentId, bookingId, null, 100, 100);
    }

    const token = await getAuthToken(studentEmail, studentPass);

    const res = await request(app)
      .get('/api/students/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(3);
    
    // Verificar que están ordenados por fecha descendente
    const dates = res.body.items.map(item => item.year + item.monthPaid);
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i] >= dates[i + 1]).toBe(true);
    }
  });

  test('debe incluir formato de costo con $', async () => {
    const studentEmail = 'student@ema.test';
    const studentPass = 'Student123*';
    const studentId = await seedUser({ email: studentEmail, password: studentPass, role: 'estudiante' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    const courseId = await seedCourse('Guitarra', 'presencial', 125.50);
    const scheduleId = await seedSchedule(courseId, teacherId);
    const bookingId = await seedBooking(studentId, null, courseId, scheduleId, teacherId);

    const paymentId = await seedPayment(studentId, 125.50, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, bookingId, null, 125.50, 125.50);

    const token = await getAuthToken(studentEmail, studentPass);

    const res = await request(app)
      .get('/api/students/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items[0].totalCost).toMatch(/^\$\d+\.\d{2}$/);
    expect(res.body.items[0].totalCost).toBe('$125.50');
  });

  test('debe generar serialNumber único por item', async () => {
    const studentEmail = 'student@ema.test';
    const studentPass = 'Student123*';
    const studentId = await seedUser({ email: studentEmail, password: studentPass, role: 'estudiante' });
    const teacherId = await seedUser({ email: 'teacher@ema.test', password: 'Teacher123*', role: 'maestro' });

    const courseId = await seedCourse('Violín', 'presencial', 100);
    const scheduleId = await seedSchedule(courseId, teacherId);
    const bookingId = await seedBooking(studentId, null, courseId, scheduleId, teacherId);

    const paymentId = await seedPayment(studentId, 100, 'efectivo', 'aceptado', '2025-11-10');
    await seedPaymentItem(paymentId, bookingId, null, 100, 100);

    const token = await getAuthToken(studentEmail, studentPass);

    const res = await request(app)
      .get('/api/students/payments/history')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.items[0].serialNumber).toMatch(/^EMA-\d+-\d+$/);
  });
});
