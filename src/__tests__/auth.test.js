import { describe, test, expect } from "bun:test";
import request from "supertest";
import app from "../server.js";

// Datos de prueba
const loginOk = { email: "admin@academia.com", password: "admin123" };
const loginBadEmail = { email: "noexiste@correo.com", password: "123456" };
const loginBadPass = { email: "admin@academia.com", password: "incorrecto" };

describe("Pruebas de login", () => {
  test("1. Login exitoso con credenciales correctas", async () => {
    const res = await request(app).post("/api/auth/login").send(loginOk);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.name).toBe("Admin");
  });

  test("2. Login falla si email no existe", async () => {
    const res = await request(app).post("/api/auth/login").send(loginBadEmail);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Usuario no encontrado");
  });

  test("3. Login falla si contraseña es incorrecta", async () => {
    const res = await request(app).post("/api/auth/login").send(loginBadPass);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Contraseña incorrecta");
  });
});

describe("Pruebas de registro", () => {
  const nuevoCorreo = `test${Date.now()}@correo.com`;

  test("4. Registro exitoso", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test",
      last_name: "User",
      phone: "+50212345678",
      email: nuevoCorreo,
      password: "test123",
      role: "padre"
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(nuevoCorreo);
  });

  test("5. Registro falla si correo ya existe", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test",
      last_name: "User",
      phone: "+50212345678",
      email: "admin@academia.com", // Ya existe
      password: "cualquier",
      role: "padre"
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("El correo ya está registrado");
  });
});