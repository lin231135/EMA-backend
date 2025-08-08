import { describe, it, expect } from "bun:test";
import db from "../../db/connection.js";

describe("DB Connection", () => {
  it("ejecuta SELECT NOW()", async () => {
    const result = await db.query("SELECT NOW()");
    expect(result.rowCount).toBe(1);
  });
});