import { describe, it, expect } from "bun:test";
import pool from "../../db/connection.js";

describe("DB Connection", () => {
  it("ejecuta SELECT NOW()", async () => {
    const result = await pool.query("SELECT NOW()");
    expect(result.rowCount).toBe(1);
  });
});