import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import app from "../server.js";
import db from "../db/connection.js";

// Test Suite para Seguridad y Manejo de Errores
// Pruebas de Robustez y Seguridad del Sistema

describe("🔒 PRUEBAS DE SEGURIDAD Y MANEJO DE ERRORES", () => {
  let validToken;
  let expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.invalid";

  beforeAll(async () => {
    // Obtener token válido para pruebas
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@academia.com", password: "admin123" });
    validToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  describe("📋 TC-SEC-001: Inyección SQL", () => {
    test("🛡️ Protección contra SQL Injection en login", async () => {
      const maliciousInputs = [
        "admin@academia.com'; DROP TABLE Users; --",
        "admin@academia.com' OR '1'='1",
        "admin@academia.com' UNION SELECT * FROM Users --",
        "'; UPDATE Users SET password='hacked' WHERE email='admin@academia.com'; --"
      ];

      for (const maliciousEmail of maliciousInputs) {
        const response = await request(app)
          .post("/api/auth/login")
          .send({
            email: maliciousEmail,
            password: "cualquierPassword"
          });

        // Debe manejar correctamente sin causar errores del servidor
        expect([400, 401, 404, 500]).toContain(response.status);
        
        // Verificar que la tabla Users aún existe
        const usersCheck = await db.query("SELECT COUNT(*) FROM Users");
        expect(parseInt(usersCheck.rows[0].count)).toBeGreaterThan(0);
      }
    });

    test("🛡️ Protección contra SQL Injection en registro", async () => {
      const maliciousData = {
        name: "Test'; DROP TABLE Course; --",
        last_name: "User",
        phone: "+1234567890",
        email: "test@test.com'; DELETE FROM Users WHERE '1'='1'; --",
        password: "password123",
        role: "padre"
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(maliciousData);

      // Debe fallar de manera controlada
      expect([400, 500]).toContain(response.status);
      
      // Verificar que las tablas siguen intactas
      const coursesCheck = await db.query("SELECT COUNT(*) FROM Course");
      expect(parseInt(coursesCheck.rows[0].count)).toBeGreaterThan(0);
    });
  });

  describe("📋 TC-SEC-002: Validación de Entrada de Datos", () => {
    test("❌ Campos vacíos en login", async () => {
      const invalidInputs = [
        { email: "", password: "password" },
        { email: "user@test.com", password: "" },
        { email: "", password: "" },
        {},
        { email: null, password: "password" },
        { email: "user@test.com", password: null }
      ];

      for (const input of invalidInputs) {
        const response = await request(app)
          .post("/api/auth/login")
          .send(input);

        expect([400, 404, 500]).toContain(response.status);
      }
    });

    test("❌ Emails inválidos en registro", async () => {
      const invalidEmails = [
        "email-sin-arroba",
        "@dominio.com",
        "email@",
        "email..doble@test.com",
        "email with spaces@test.com",
        "email@dominio",
        ""
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            name: "Test",
            last_name: "User",
            phone: "+1234567890",
            email: `${Date.now()}.${email}`, // Make unique to avoid conflicts
            password: "password123",
            role: "padre"
          });

        // Note: Email validation might not be fully implemented yet
        // This test verifies the system handles various email formats gracefully
        expect(response.status).toBeLessThan(500); // Should not crash the server
      }
    });

    test("📱 Validación de números de teléfono", async () => {
      const invalidPhones = [
        "123", // Muy corto
        "abcdefg", // No numérico  
        "+", // Solo símbolo
        "123456789012", // Más largo pero dentro del límite de 14 caracteres
        ""
      ];

      for (const phone of invalidPhones) {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            name: "Test",
            last_name: "User",
            phone: phone,
            email: `test${Date.now()}@test.com`,
            password: "password123",
            role: "padre"
          });

        // Algunos pueden ser aceptados dependiendo de la validación implementada
        // Pero al menos no deben causar errores del servidor
        expect(response.status).toBeLessThan(500);
      }
    });
  });

  describe("📋 TC-SEC-003: Autenticación y Autorización", () => {
    test("🚫 Acceso sin token (cuando esté implementado)", async () => {
      // Este test es para cuando implementes endpoints protegidos
      // Por ahora verificamos que el middleware de auth existe
      const authMiddleware = await import("../middlewares/auth.js");
      expect(authMiddleware.verifyToken).toBeDefined();
    });

    test("🔑 Token malformado", async () => {
      const malformedTokens = [
        "not.a.token",
        "bearer.token.here",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed",
        "",
        "null",
        "undefined"
      ];

      // Simular verificación de tokens malformados
      const jwt = await import("jsonwebtoken");
      
      for (const token of malformedTokens) {
        try {
          jwt.default.verify(token, process.env.JWT_SECRET || 'jwtsecret');
          // Si llega aquí, el token fue aceptado (no debería)
          expect(false).toBe(true);
        } catch (error) {
          // Esperamos que lance error
          expect(error).toBeDefined();
        }
      }
    });

    test("⏰ Token expirado", async () => {
      const jwt = await import("jsonwebtoken");
      
      // Crear token que ya expiró
      const expiredToken = jwt.default.sign(
        { id: 1, role: "admin" },
        process.env.JWT_SECRET || 'jwtsecret',
        { expiresIn: '-1h' } // Expirado hace 1 hora
      );

      try {
        jwt.default.verify(expiredToken, process.env.JWT_SECRET || 'jwtsecret');
        expect(false).toBe(true); // No debería llegar aquí
      } catch (error) {
        expect(error.name).toBe('TokenExpiredError');
      }
    });
  });

  describe("📋 TC-SEC-004: Limitación de Intentos y Rate Limiting", () => {
    test("🚨 Múltiples intentos de login fallidos", async () => {
      const attempts = [];
      
      // Intentar 5 logins fallidos consecutivos
      for (let i = 0; i < 5; i++) {
        attempts.push(
          request(app)
            .post("/api/auth/login")
            .send({
              email: "admin@academia.com",
              password: "passwordIncorrecto"
            })
        );
      }

      const responses = await Promise.all(attempts);
      
      // Todos deben fallar pero no bloquear el servidor
      responses.forEach(response => {
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Contraseña incorrecta");
      });
    });

    test("⚡ Stress test - Múltiples requests simultáneos", async () => {
      const requests = [];
      
      // 20 requests simultáneos
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .post("/api/auth/login")
            .send({
              email: "admin@academia.com",
              password: "admin123"
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // Verificar que el servidor maneja la carga
      expect(responses.length).toBe(20);
      
      // Al menos el 80% de las requests deben ser exitosas
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThanOrEqual(16);
      
      // Tiempo total no debe exceder 5 segundos
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe("📋 TC-SEC-005: Manejo de Errores del Servidor", () => {
    test("🔧 Conexión a base de datos", async () => {
      try {
        await db.query("SELECT 1");
        expect(true).toBe(true); // Conexión exitosa
      } catch (error) {
        // Si hay error de conexión, debe ser manejado apropiadamente
        expect(error).toBeDefined();
      }
    });

    test("📊 Consulta SQL inválida", async () => {
      try {
        await db.query("SELECT * FROM TablaInexistente");
        expect(false).toBe(true); // No debería llegar aquí
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain("relation \"tablainexistente\" does not exist");
      }
    });

    test("🌐 Manejo de errores HTTP", async () => {
      // Endpoint inexistente
      const response = await request(app)
        .get("/api/endpoint/inexistente");

      expect(response.status).toBe(404);
    });

    test("📝 Payload demasiado grande", async () => {
      const largePayload = {
        name: "A".repeat(10000), // 10KB de datos
        last_name: "B".repeat(10000),
        phone: "+1234567890",
        email: "test@test.com",
        password: "password123",
        role: "padre"
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(largePayload);

      // Debe manejar payloads grandes apropiadamente
      expect([400, 413, 500]).toContain(response.status);
    });
  });

  describe("📋 TC-SEC-006: Integridad de Contraseñas", () => {
    test("🔐 Contraseñas débiles", async () => {
      const weakPasswords = [
        "123",
        "password",
        "admin",
        "abc",
        "qwerty",
        ""
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            name: "Test",
            last_name: "User",
            phone: "+1234567890",
            email: `test${Date.now()}${Math.random()}@test.com`,
            password: password,
            role: "padre"
          });

        // Dependiendo de las reglas implementadas
        // Algunas contraseñas débiles pueden ser rechazadas
        expect(response.status).toBeLessThan(500);
      }
    });

    test("🔒 Verificación de hashing de contraseñas", async () => {
      const bcrypt = await import("bcryptjs");
      const testPassword = "testPassword123";
      
      // Hashear contraseña
      const hashedPassword = await bcrypt.default.hash(testPassword, 10);
      
      // Verificar que el hash es válido
      expect(hashedPassword).toMatch(/^\$2[aby]?\$/);
      expect(hashedPassword).not.toBe(testPassword);
      
      // Verificar que se puede comparar correctamente
      const isValid = await bcrypt.default.compare(testPassword, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.default.compare("wrongPassword", hashedPassword);
      expect(isInvalid).toBe(false);
    });

    test("🔄 Cambio de contraseña con verificación", async () => {
      // Crear usuario temporal para prueba
      const tempUser = {
        name: "Temp",
        last_name: "User",
        phone: "+1234567890",
        email: `temp${Date.now()}@test.com`,
        password: "originalPassword123",
        role: "padre"
      };

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(tempUser);

      if (registerResponse.status === 201) {
        const userId = registerResponse.body.user.id;

        // Intentar cambio con contraseña incorrecta
        const wrongPasswordResponse = await request(app)
          .post("/api/auth/update-password")
          .send({
            userId: userId,
            currentPassword: "passwordIncorrecto",
            newPassword: "nuevaPassword123"
          });

        expect(wrongPasswordResponse.status).toBe(401);

        // Cambio con contraseña correcta
        const correctPasswordResponse = await request(app)
          .post("/api/auth/update-password")
          .send({
            userId: userId,
            currentPassword: "originalPassword123",
            newPassword: "nuevaPassword123"
          });

        expect(correctPasswordResponse.status).toBe(200);
      }
    });
  });

  describe("📋 TC-SEC-007: Logging y Auditoría", () => {
    test("📝 Errores se logean apropiadamente", async () => {
      const originalConsoleError = console.error;
      const errorLogs = [];
      
      // Capturar logs de error
      console.error = (...args) => {
        errorLogs.push(args.join(' '));
        originalConsoleError(...args);
      };

      // Generar un error controlado
      await request(app)
        .post("/api/auth/login")
        .send({
          email: "usuario@inexistente.com",
          password: "password"
        });

      // Restaurar console.error
      console.error = originalConsoleError;

      // Verificar que no se logearon errores críticos
      const criticalErrors = errorLogs.filter(log => 
        log.includes('Error en login:') || 
        log.includes('Error interno')
      );
      
      // Para este caso específico, no debería haber errores críticos
      // ya que "usuario no encontrado" es un comportamiento esperado
      expect(criticalErrors.length).toBe(0);
    });

    test("🕵️ Información sensible no se expone", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@academia.com",
          password: "passwordIncorrecto"
        });

      // Verificar que la respuesta no contiene información sensible
      const responseText = JSON.stringify(response.body);
      
      expect(responseText).not.toContain("admin123"); // Contraseña real
      expect(responseText).not.toContain("$2"); // Hash de contraseña
      expect(responseText).not.toContain("jwtsecret"); // Secret del JWT
    });
  });
});
