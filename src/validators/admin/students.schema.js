import { z } from 'zod';

/**
 * Schema de validación para crear un estudiante
 */
export const createStudentSchema = z.object({
  parent_id: z.number({
    required_error: 'El ID del padre es obligatorio',
    invalid_type_error: 'El ID del padre debe ser un número'
  })
    .int('El ID del padre debe ser un número entero')
    .positive('El ID del padre debe ser un número positivo'),
  
  name: z.string({
    required_error: 'El nombre es obligatorio',
    invalid_type_error: 'El nombre debe ser una cadena de texto'
  })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres'),
  
  birth_date: z.string({
    required_error: 'La fecha de nacimiento es obligatoria',
    invalid_type_error: 'La fecha de nacimiento debe ser una cadena de texto'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe tener el formato YYYY-MM-DD'),
  
  is_solvent: z.boolean({
    invalid_type_error: 'El campo is_solvent debe ser un valor booleano'
  })
    .optional(),
  
  // Dirección opcional
  address: z.object({
    city: z.string({
      required_error: 'La ciudad es obligatoria',
      invalid_type_error: 'La ciudad debe ser una cadena de texto'
    })
      .max(100, 'La ciudad no puede exceder 100 caracteres'),
    
    apartment: z.string({
      invalid_type_error: 'El apartamento debe ser una cadena de texto'
    })
      .max(100, 'El apartamento no puede exceder 100 caracteres')
      .nullable()
      .optional(),
    
    street_avenue: z.string({
      required_error: 'La calle/avenida es obligatoria',
      invalid_type_error: 'La calle/avenida debe ser una cadena de texto'
    })
      .max(100, 'La calle/avenida no puede exceder 100 caracteres'),
    
    zone: z.string({
      required_error: 'La zona es obligatoria',
      invalid_type_error: 'La zona debe ser una cadena de texto'
    })
      .max(50, 'La zona no puede exceder 50 caracteres'),
    
    house_number: z.string({
      required_error: 'El número de casa es obligatorio',
      invalid_type_error: 'El número de casa debe ser una cadena de texto'
    })
      .max(50, 'El número de casa no puede exceder 50 caracteres'),
    
    neighborhood: z.string({
      required_error: 'La colonia es obligatoria',
      invalid_type_error: 'La colonia debe ser una cadena de texto'
    })
      .max(50, 'La colonia no puede exceder 50 caracteres'),
    
    municipality: z.string({
      required_error: 'El municipio es obligatorio',
      invalid_type_error: 'El municipio debe ser una cadena de texto'
    })
      .max(100, 'El municipio no puede exceder 100 caracteres'),
    
    is_primary: z.boolean({
      invalid_type_error: 'El campo is_primary debe ser un valor booleano'
    })
      .optional()
  }).optional()
});

/**
 * Schema de validación para actualizar un estudiante
 */
export const updateStudentSchema = z.object({
  parent_id: z.number({
    invalid_type_error: 'El ID del padre debe ser un número'
  })
    .int('El ID del padre debe ser un número entero')
    .positive('El ID del padre debe ser un número positivo')
    .optional(),
  
  name: z.string({
    invalid_type_error: 'El nombre debe ser una cadena de texto'
  })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .optional(),
  
  birth_date: z.string({
    invalid_type_error: 'La fecha de nacimiento debe ser una cadena de texto'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe tener el formato YYYY-MM-DD')
    .optional(),
  
  is_solvent: z.boolean({
    invalid_type_error: 'El campo is_solvent debe ser un valor booleano'
  })
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo para actualizar' }
);

/**
 * Schema de validación para desactivar un estudiante
 * Nota: Por ahora solo se cancelan las reservas futuras
 * El soft delete completo se implementará cuando se agregue is_active a la tabla Kid
 */
export const deactivateStudentSchema = z.object({
  // Por ahora no requiere campos en el body
  // Se puede dejar vacío o agregar campos cuando se implemente is_active
}).optional();

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
