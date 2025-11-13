import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    kid_id: z.number().int().positive().optional().nullable(),
    schedule_id: z.number().int().positive({ message: "schedule_id is required" }),
    payment_method: z.enum(['efectivo', 'transferencia', 'deposito'], {
      errorMap: () => ({ message: "payment_method must be one of: efectivo, transferencia, deposito" })
    }),
    note: z.string().max(255).optional().or(z.literal("")).nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const getBookingByIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "id must be a valid number" })
  }),
});
