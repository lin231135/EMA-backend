import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    kid_id: z.number().int().positive().optional().nullable(),
    schedule_id: z.number().int().positive({ message: "schedule_id is required" }),
    note: z.string().max(255).optional().or(z.literal("")).nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
