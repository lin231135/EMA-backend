import { describe, it, expect } from "bun:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("Auth Unit - crypto y JWT (sin DB)", () => {
  it("hashea y compara contraseñas correctamente", async () => {
    const plain = "Secret123*";
    const hash = await bcrypt.hash(plain, 10);
    expect(await bcrypt.compare(plain, hash)).toBe(true);
    expect(await bcrypt.compare("otra", hash)).toBe(false);
  });

  it("firma y verifica un JWT válido", () => {
    const secret = process.env.JWT_SECRET || "jwtsecret";
    const token = jwt.sign({ id: 42, role: "admin" }, secret, { expiresIn: "1h" });
    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(42);
    expect(decoded.role).toBe("admin");
  });
});