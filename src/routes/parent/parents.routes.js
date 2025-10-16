/**
 * Rutas para funcionalidades específicas de padres
 * Todas las rutas requieren autenticación mediante JWT
 * Base path: /api/parents
 */

// Importación del enrutador de Express para definir rutas
import { Router } from "express";

// Middleware de autenticación para proteger las rutas
import { verifyToken } from "../../middlewares/auth.js";

// Importación de controladores para la gestión de perfiles de padres e hijos
import {
  getChildrenByParent,    // Obtiene la lista de hijos de un padre
  getParentProfiles,      // Obtiene perfiles completos (padre + hijos)
} from "../../controllers/parent/selectProfile.controller.js";

// Crear instancia del enrutador
const router = Router();

/**
 * GET /api/parents/children
 * Obtiene la lista de todos los hijos asociados al padre autenticado
 */
router.get("/children", verifyToken, getChildrenByParent);

/**
 * GET /api/parents/profiles
 * Obtiene los perfiles completos para la pantalla de selección
 * Retorna tanto el perfil del padre como los perfiles de sus hijos
 */
router.get("/profiles", verifyToken, getParentProfiles);

export default router;
