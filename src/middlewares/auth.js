import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación y autorización para proteger rutas según el rol del usuario.
 *
 * Funcionalidades:
 * - `verifyToken`: Verifica que el token JWT esté presente y sea válido. Si lo es, añade la información del usuario al objeto `req.user`.
 * - `checkRole`: Genera middlewares que restringen el acceso a rutas según el rol del usuario (por ejemplo: admin, maestro, estudiante, etc.).
 *
 * Uso:
 * En tus rutas puedes proteger endpoints así:
 *
 * import { verifyToken, isAdmin, isTeacher } from './middlewares/auth.js';
 *
 * router.get('/admin/usuarios', verifyToken, isAdmin, controller.getUsuarios);
 * router.post('/clases', verifyToken, isTeacher, controller.crearClase);
 *
 * Esto asegura que solo usuarios autenticados y con el rol adecuado puedan acceder a ciertas funcionalidades del sistema.
 */

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido o formato inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Token inválido' });
  }
};

const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Acceso denegado. Se requiere rol ${role}` });
    }
    next();
  };
};

// Exportar middlewares específicos por rol
export const isAdmin = checkRole('admin');
export const isSup = checkRole('sup');
export const isTeacher = checkRole('maestro');
export const isParent = checkRole('padre');
export const isStudent = checkRole('estudiante');