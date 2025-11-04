import { z } from 'zod';

/**
 * Schema de validación para crear un Schedule
 * Valida los campos requeridos para agendar una clase
 */
export const createScheduleSchema = z.object({
  body: z.object({
    course_id: z.number({
      required_error: "El ID del curso es requerido",
      invalid_type_error: "El ID del curso debe ser un número"
    }).int("El ID del curso debe ser un número entero").positive("El ID del curso debe ser positivo"),
    
    schedule_date: z.string({
      required_error: "La fecha del horario es requerida",
      invalid_type_error: "La fecha debe ser una cadena de texto"
    }).regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe estar en formato YYYY-MM-DD"),
    
    start_time: z.string({
      required_error: "La hora de inicio es requerida",
      invalid_type_error: "La hora de inicio debe ser una cadena de texto"
    }).regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "La hora de inicio debe estar en formato HH:MM o HH:MM:SS"),
    
    end_time: z.string({
      required_error: "La hora de finalización es requerida",
      invalid_type_error: "La hora de finalización debe ser una cadena de texto"
    }).regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "La hora de finalización debe estar en formato HH:MM o HH:MM:SS")
  }).refine((data) => {
    // Validar que la fecha no sea anterior a hoy
    const scheduleDate = new Date(data.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scheduleDate >= today;
  }, {
    message: "La fecha del horario no puede ser anterior a hoy",
    path: ["schedule_date"]
  }).refine((data) => {
    // Validar que end_time sea posterior a start_time
    const start = data.start_time.split(':').map(Number);
    const end = data.end_time.split(':').map(Number);
    
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    return endMinutes > startMinutes;
  }, {
    message: "La hora de finalización debe ser posterior a la hora de inicio",
    path: ["end_time"]
  })
});
