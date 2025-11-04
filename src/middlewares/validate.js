/**
 * Middleware de validación usando Zod
 * Valida el request contra el schema proporcionado
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Error de validación',
        message: 'Los datos proporcionados no son válidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
};
