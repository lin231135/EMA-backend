import { z } from 'zod';

/**
 * Schema de validación para actualizar/confirmar un pago (Admin)
 * La administradora puede editar todos los campos del pago
 * NOTA: Todos los pagos se asumen en USD según requerimientos
 */
export const updatePaymentSchema = z.object({
  payment_method: z.enum(['efectivo', 'transferencia'], {
    errorMap: () => ({ message: 'El método de pago debe ser: efectivo o transferencia' })
  })
    .optional(),
  
  total: z.number({
    invalid_type_error: 'El total debe ser un número'
  })
    .positive('El total debe ser mayor a 0')
    .optional(),
  
  payment_date: z.string({
    invalid_type_error: 'La fecha de pago debe ser una cadena de texto'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .refine(
      (date) => new Date(date) <= new Date(),
      'La fecha de pago no puede ser futura'
    )
    .optional(),
  
  state: z.enum(['pendiente', 'en revision', 'aceptado', 'rechazado', 'cancelado'], {
    errorMap: () => ({ message: 'El estado debe ser: pendiente, en revision, aceptado, rechazado o cancelado' })
  })
    .optional(),
  
  reference_pic: z.string({
    invalid_type_error: 'La referencia de imagen debe ser una cadena de texto'
  })
    .url('La referencia de imagen debe ser una URL válida')
    .optional()
    .nullable(),
  
  note: z.string({
    invalid_type_error: 'La nota debe ser una cadena de texto'
  })
    .max(500, 'La nota no puede exceder 500 caracteres')
    .optional()
    .nullable()
})
.refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo para actualizar' }
)
// Validación condicional: reference_pic obligatorio para transferencia
.refine(
  (data) => {
    if (data.payment_method === 'transferencia') {
      return data.reference_pic !== undefined && data.reference_pic !== null && data.reference_pic !== '';
    }
    return true;
  },
  {
    message: 'La prueba de pago es obligatoria para transferencias',
    path: ['reference_pic']
  }
);

/**
 * Schema de validación para confirmar un pago
 * Simplemente cambia el estado a 'solvente'
 */
export const confirmPaymentSchema = z.object({
  note: z.string({
    invalid_type_error: 'La nota debe ser una cadena de texto'
  })
    .max(500, 'La nota no puede exceder 500 caracteres')
    .optional()
    .nullable()
});

/**
 * Schema de validación para crear un pago (Admin)
 */
export const createPaymentSchema = z.object({
  user_id: z.number({
    required_error: 'El ID del usuario (padre) es requerido',
    invalid_type_error: 'El ID del usuario debe ser un número'
  })
    .int('El ID del usuario debe ser un número entero')
    .positive('El ID del usuario debe ser positivo'),
  
  payment_method: z.enum(['efectivo', 'transferencia'], {
    errorMap: () => ({ message: 'El método de pago debe ser: efectivo o transferencia' })
  }),
  
  total: z.number({
    required_error: 'El total es requerido',
    invalid_type_error: 'El total debe ser un número'
  })
    .positive('El total debe ser mayor a 0'),
  
  payment_date: z.string({
    required_error: 'La fecha de pago es requerida',
    invalid_type_error: 'La fecha de pago debe ser una cadena de texto'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD'),
  
  booking_ids: z.array(z.number().int().positive(), {
    required_error: 'Debe proporcionar al menos un booking_id',
    invalid_type_error: 'booking_ids debe ser un array de números'
  })
    .min(1, 'Debe proporcionar al menos un booking a pagar')
    .optional(),
  
  state: z.enum(['pendiente', 'en revision', 'aceptado', 'rechazado', 'cancelado'], {
    errorMap: () => ({ message: 'El estado debe ser: pendiente, en revision, aceptado, rechazado o cancelado' })
  })
    .optional()
    .default('en revision'),
  
  reference_pic: z.string({
    invalid_type_error: 'La referencia de imagen debe ser una cadena de texto'
  })
    .url('La referencia de imagen debe ser una URL válida')
    .optional()
    .nullable(),
  
  note: z.string({
    invalid_type_error: 'La nota debe ser una cadena de texto'
  })
    .max(500, 'La nota no puede exceder 500 caracteres')
    .optional()
    .nullable()
})
.refine(
  (data) => {
    // Si el método es transferencia, debe haber comprobante
    if (data.payment_method === 'transferencia' && !data.reference_pic) {
      return false;
    }
    return true;
  },
  {
    message: 'El comprobante es obligatorio para pagos por transferencia',
    path: ['reference_pic']
  }
);

/**
 * Schema de validación para rechazar un pago
 */
export const rejectPaymentSchema = z.object({
  note: z.string({
    required_error: 'Debe proporcionar una razón para rechazar el pago',
    invalid_type_error: 'La nota debe ser una cadena de texto'
  })
    .min(10, 'La razón debe tener al menos 10 caracteres')
    .max(500, 'La razón no puede exceder 500 caracteres')
});

/**
 * NOTA: No hay schema de validación de query params
 * Los filtros se manejan en el frontend
 */


/**
 * Middleware de validación genérico usando Zod
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: 'Error de validación',
          details: errors
        });
      }
      
      // Si no es un ZodError, devolver error genérico
      console.error('Error de validación no-Zod:', error);
      return res.status(500).json({
        error: 'Error interno de validación',
        message: error?.message || 'Error desconocido'
      });
    }
  };
};

/**
 * Middleware de validación para query params
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: 'Error de validación en parámetros de consulta',
          details: errors
        });
      }
      
      return res.status(500).json({
        error: 'Error interno de validación'
      });
    }
  };
};
