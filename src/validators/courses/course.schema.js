import { z } from 'zod';

/**
 * Schema de validación para la creación de un curso
 * Valida que todos los campos requeridos estén presentes y cumplan con las restricciones
 */
export const createCourseSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'El nombre del curso es requerido',
        invalid_type_error: 'El nombre debe ser una cadena de texto'
      })
      .min(1, 'El nombre del curso no puede estar vacío')
      .max(255, 'El nombre del curso no puede exceder 255 caracteres')
      .trim(),
    
    modality: z
      .enum(['academia', 'domicilio'], {
        required_error: 'La modalidad es requerida',
        invalid_type_error: 'La modalidad debe ser "academia" o "domicilio"'
      }),
    
    capacity: z
      .number({
        required_error: 'La capacidad es requerida',
        invalid_type_error: 'La capacidad debe ser un número'
      })
      .int('La capacidad debe ser un número entero')
      .positive('La capacidad debe ser mayor a 0')
      .max(1000, 'La capacidad no puede exceder 1000 estudiantes'),
    
    cost: z
      .number({
        required_error: 'El costo es requerido',
        invalid_type_error: 'El costo debe ser un número'
      })
      .nonnegative('El costo no puede ser negativo')
      .multipleOf(0.01, 'El costo debe tener máximo 2 decimales')
      .max(999999.99, 'El costo no puede exceder 999999.99'),
    
    is_active: z
      .boolean({
        invalid_type_error: 'is_active debe ser un valor booleano'
      })
      .optional()
      .default(true)
  })
});
