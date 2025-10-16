// src/validators/join.team.schema.js
import { z } from "zod";

export const joinTeamSchema = z.object({
  name: z.string().min(1, "name required").max(200),
  email: z.string().email("invalid email").max(200),
  subject: z.string().min(1, "subject required").max(200),
  message: z.string().min(1, "message required").max(5000),
});
