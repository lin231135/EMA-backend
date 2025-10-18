import { z } from 'zod';

/**
 * Schema de validación para crear un hijo
 */
export const createKidSchema = z.object({
  name: z.string({
    required_error: 'El nombre es obligatorio',
    invalid_type_error: 'El nombre debe ser una cadena de texto'
  })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  
  birth_date: z.string({
    required_error: 'La fecha de nacimiento es obligatoria',
    invalid_type_error: 'La fecha de nacimiento debe ser una cadena de texto'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe tener el formato YYYY-MM-DD'),
  
  is_solvent: z.boolean({
    invalid_type_error: 'El campo is_solvent debe ser un valor booleano'
  })
    .optional()
    .default(false)
});

/**
 * Middleware de validación genérico usando Zod
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      
      // Reemplaza los datos originales con los validados y sanitizados
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
      
      // Error inesperado
      return res.status(500).json({
        error: 'Error interno de validación'
      });
    }
  };
};
