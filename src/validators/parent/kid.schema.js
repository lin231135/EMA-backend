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
 * Schema de validación para actualizar un hijo (body)
 * Todos los campos son opcionales, pero al menos uno debe estar presente
 */
export const updateKidSchema = z.object({
  name: z.string({
    invalid_type_error: 'El nombre debe ser una cadena de texto'
  })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim()
    .optional(),
  
  birth_date: z.string({
    invalid_type_error: 'La fecha de nacimiento debe ser una cadena de texto'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe tener el formato YYYY-MM-DD')
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Debe proporcionar al menos un campo para actualizar'
  }
);

/**
 * Schema de validación para eliminar un hijo
 * Valida que el parámetro kidId sea un número entero positivo
 */
export const deleteKidSchema = z.object({
  kidId: z.string({
    required_error: 'El ID del hijo es obligatorio',
    invalid_type_error: 'El ID del hijo debe ser una cadena de texto'
  })
    .regex(/^\d+$/, 'El ID del hijo debe ser un número entero positivo')
    .transform((val) => parseInt(val, 10))
});

/**
 * Schema de validación para archivar/desactivar un hijo
 * Reutiliza la misma validación que deleteKidSchema
 */
export const archiveKidSchema = deleteKidSchema;

/**
 * Schema de validación para desarchivar/reactivar un hijo
 * Reutiliza la misma validación que deleteKidSchema
 */
export const unarchiveKidSchema = deleteKidSchema;

/**
 * Schema de validación (de params) para actualizar la información de un hijo
 * Reutiliza la misma validación que deleteKidSchema
 */
export const updateKidParamSchema = deleteKidSchema;

/**
 * Middleware de validación genérico usando Zod para el body
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

/**
 * Middleware de validación genérico usando Zod para los parámetros de ruta
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.params);
      
      // Reemplaza los parámetros originales con los validados
      req.params = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: 'Error de validación de parámetros',
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
