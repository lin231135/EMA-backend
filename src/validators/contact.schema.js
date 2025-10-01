// src/validators/contact.schema.js
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "name required").max(200),
  email: z.string().email("invalid email").max(200),
  phone: z.string().max(50).optional().or(z.literal("")),
  subject: z.string().min(1, "subject required").max(200),
  message: z.string().min(1, "message required").max(5000),
});
