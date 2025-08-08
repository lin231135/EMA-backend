import { describe, it, expect, mock } from "bun:test";
import { updateUser } from "../../controllers/user.controller.js";

describe("User Controller Unit", () => {
  it("rechaza update si no es el mismo user ni admin", async () => {
    const req = { params: { id: "2" }, body: {}, user: { id: 1, role: "padre" } };
    const res = {
      status: mock(() => res),
      json: mock(() => res),
    };

    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});