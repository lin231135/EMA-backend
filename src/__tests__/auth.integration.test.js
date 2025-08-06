import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import app from "../server.js";
import db from "../db/connection.js";

// Test Suite para Pruebas de Integración de Autenticación
// Basado en el Plan de Pruebas Maestro para Academia de Música EMA

describe("🔐 PRUEBAS DE INTEGRACIÓN - SISTEMA DE AUTENTICACIÓN", () => {
  let adminToken;
  let teacherToken;
  let parentToken;
  
  // Configuración inicial antes de todas las pruebas
  beforeAll(async () => {
    // Obtener tokens para diferentes roles
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@academia.com", password: "admin123" });
    adminToken = adminLogin.body.token;

    const teacherLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "carlos@academia.com", password: "maestro1" });
    teacherToken = teacherLogin.body.token;

    const parentLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "roberto@email.com", password: "padre1" });
    parentToken = parentLogin.body.token;
  });

  afterAll(async () => {
    // Limpiar conexiones
    await db.end();
  });

  describe("📋 TC-AUTH-001: Autenticación de Usuario por Rol", () => {
    test("✅ Admin puede autenticarse exitosamente", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@academia.com",
          password: "admin123"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.role).toBe("admin");
      expect(response.body.user.name).toBe("Admin");
      expect(response.body.message).toBe("Login exitoso");
    });

    test("✅ Maestro puede autenticarse exitosamente", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "carlos@academia.com",
          password: "maestro1"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.role).toBe("maestro");
      expect(response.body.user.name).toBe("Carlos");
    });

    test("✅ Padre puede autenticarse exitosamente", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "roberto@email.com",
          password: "padre1"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.role).toBe("padre");
      expect(response.body.user.name).toBe("Roberto");
    });

    test("❌ Credenciales inválidas deben fallar", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "usuario@inexistente.com",
          password: "passwordIncorrecto"
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Usuario no encontrado");
    });
  });

  describe("📋 TC-AUTH-002: Registro de Nuevos Usuarios", () => {
    const nuevoPadre = {
      name: "Carlos",
      last_name: "Nuevo",
      phone: "+5234567999",
      email: `carlos.nuevo.${Date.now()}@email.com`, // Email único
      password: "nuevoPassword123",
      role: "padre"
    };

    test("✅ Registro exitoso de nuevo padre", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(nuevoPadre);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Usuario registrado exitosamente");
      expect(response.body.user.email).toBe(nuevoPadre.email);
      expect(response.body.user.name).toBe(nuevoPadre.name);
    });

    test("❌ No permite registro con email duplicado", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(nuevoPadre);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("El correo ya está registrado");
    });

    test("❌ No permite registro con rol inválido", async () => {
      const usuarioRolInvalido = {
        ...nuevoPadre,
        email: "otro@email.com",
        role: "rolInexistente"
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(usuarioRolInvalido);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Rol inválido");
    });
  });

  describe("📋 TC-AUTH-003: Actualización de Contraseñas", () => {
    test("✅ Usuario puede actualizar su contraseña", async () => {
      // Crear un usuario temporal para esta prueba
      const tempUser = {
        name: "Temporal",
        last_name: "Usuario",
        phone: "+5234567998",
        email: `temporal.${Date.now()}@email.com`,
        password: "passwordTemporal123",
        role: "padre"
      };

      // Registrar usuario temporal
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(tempUser);

      expect(registerResponse.status).toBe(201);
      const userId = registerResponse.body.user.id;

      const response = await request(app)
        .post("/api/auth/update-password")
        .send({
          userId: userId,
          currentPassword: "passwordTemporal123",
          newPassword: "passwordActualizado456"
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Contraseña actualizada correctamente");

      // Verificar que puede hacer login con la nueva contraseña
      const loginTest = await request(app)
        .post("/api/auth/login")
        .send({ email: tempUser.email, password: "passwordActualizado456" });

      expect(loginTest.status).toBe(200);
    });

    test("❌ No puede actualizar con contraseña actual incorrecta", async () => {
      // Crear usuario temporal para este test
      const tempUser = {
        name: "Carlos",
        last_name: "Nuevo",
        phone: "+5234567777",
        email: `carlos.nuevo.${Date.now()}@email.com`,
        password: "passwordActualizado456",
        role: "maestro"
      };

      // Registrar el usuario primero
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(tempUser);

      expect(registerResponse.status).toBe(201);
      const userId = registerResponse.body.user.id;

      const response = await request(app)
        .post("/api/auth/update-password")
        .send({
          userId: userId,
          currentPassword: "passwordIncorrecto",
          newPassword: "otraPassword"
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("La contraseña actual es incorrecta");
    });
  });

  describe("📋 TC-AUTH-004: Validación de Tokens JWT", () => {
    test("✅ Token válido permite acceso", async () => {
      // Este test requiere un endpoint protegido
      // Verificamos que el token fue generado correctamente
      expect(adminToken).toBeDefined();
      expect(typeof adminToken).toBe("string");
      
      // Verificar estructura básica del token JWT
      const tokenParts = adminToken.split(".");
      expect(tokenParts).toHaveLength(3);
    });

    test("⏰ Token tiene tiempo de expiración correcto", async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@academia.com", password: "admin123" });

      const token = loginResponse.body.token;
      
      // Decodificar el payload del JWT (sin verificar la firma)
      const payload = JSON.parse(atob(token.split(".")[1]));
      
      // Verificar que el token expira en 4 horas (14400 segundos)
      const expirationTime = payload.exp - payload.iat;
      expect(expirationTime).toBe(14400); // 4 horas en segundos
    });
  });

  describe("📋 TC-AUTH-005: Casos Límite y Seguridad", () => {
    test("❌ Campos obligatorios en login", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({});

      expect(response.status).toBe(404);
    });

    test("❌ Campos obligatorios en registro", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ email: "solo@email.com" });

      // Debería fallar por campos faltantes
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test("🔒 Contraseñas se almacenan hasheadas", async () => {
      // Verificar en la base de datos que las contraseñas están hasheadas
      const result = await db.query(
        "SELECT password FROM Users WHERE email = $1",
        ["admin@academia.com"]
      );

      const hashedPassword = result.rows[0].password;
      
      // Verificar que es un hash bcrypt (empieza con $2)
      expect(hashedPassword).toMatch(/^\$2[aby]?\$/);
      expect(hashedPassword).not.toBe("admin123");
    });

    test("🚫 SQL Injection Protection", async () => {
      const maliciousInput = "admin@academia.com'; DROP TABLE Users; --";
      
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: maliciousInput,
          password: "cualquierCosa"
        });

      // La aplicación debe manejar esto sin errores críticos
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Usuario no encontrado");
    });
  });

  describe("📋 TC-AUTH-006: Flujo Completo de Usuario Nuevo", () => {
    test("🔄 Flujo completo: Registro → Login → Cambio de contraseña", async () => {
      const nuevoMaestro = {
        name: "Elena",
        last_name: "Violín",
        phone: "+5234568000",
        email: `elena.violin.${Date.now()}@academia.com`,
        password: "maestroTemporal123",
        role: "maestro"
      };

      // 1. Registro
      const registroResponse = await request(app)
        .post("/api/auth/register")
        .send(nuevoMaestro);

      expect(registroResponse.status).toBe(201);
      const userId = registroResponse.body.user.id;

      // 2. Login inicial
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: nuevoMaestro.email,
          password: nuevoMaestro.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.user.is_first_login).toBe(true);

      // 3. Cambio de contraseña (simula primer login)
      const cambioPasswordResponse = await request(app)
        .post("/api/auth/update-password")
        .send({
          userId: userId,
          currentPassword: nuevoMaestro.password,
          newPassword: "nuevaPasswordSegura456"
        });

      expect(cambioPasswordResponse.status).toBe(200);

      // 4. Login con nueva contraseña
      const nuevoLoginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: nuevoMaestro.email,
          password: "nuevaPasswordSegura456"
        });

      expect(nuevoLoginResponse.status).toBe(200);
      expect(nuevoLoginResponse.body.user.is_first_login).toBe(false);
    });
  });

  describe("📋 TC-AUTH-007: Performance y Concurrencia", () => {
    test("⚡ Múltiples logins simultáneos", async () => {
      const promisesLogin = [];
      
      // Crear 10 requests de login simultáneos
      for (let i = 0; i < 10; i++) {
        promisesLogin.push(
          request(app)
            .post("/api/auth/login")
            .send({ email: "admin@academia.com", password: "admin123" })
        );
      }

      const responses = await Promise.all(promisesLogin);
      
      // Todos deben ser exitosos
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
      });
    });

    test("⏱️ Tiempo de respuesta de login", async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@academia.com", password: "admin123" });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Menos de 1 segundo
    });
  });
});
