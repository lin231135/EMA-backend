/**
 * Rutas para funcionalidades específicas de padres
 * Base path: /api/parents
 */
import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.js";

// Controladores para selección de perfiles (ya existentes)
import {
  getChildrenByParent,
  getParentProfiles,
  createChild,
  deleteChild,
  archiveChild,
  unarchiveChild,
} from "../../controllers/parent/selectProfile.controller.js";

// Controladores de dashboard del padre
import {
  getChildrenForDashboard,
  addNote,
  getFeedback,
  getTodayClasses,
  getNextClasses,
} from "../../controllers/parent/parent.controller.js";

// Validadores
import { 
  createKidSchema, 
  deleteKidSchema,
  archiveKidSchema,
  unarchiveKidSchema,
  validate,
  validateParams 
} from "../../validators/parent/kid.schema.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                          Sección: Selección de perfil                      */
/* -------------------------------------------------------------------------- */
/**
 * GET /api/parents/children
 * Devuelve todos los hijos asociados al padre logueado (para pantalla de selección de perfil)
 */
router.get("/children", verifyToken, getChildrenByParent);

/**
 * POST /api/parents/children
 * Crea un nuevo perfil de hijo asociado al padre logueado
 */
router.post("/children", verifyToken, validate(createKidSchema), createChild);

/**
 * DELETE /api/parents/children/:kidId
 * Elimina un perfil de hijo asociado al padre logueado
 */
router.delete("/children/:kidId", verifyToken, validateParams(deleteKidSchema), deleteChild);

/**
 * PATCH /api/parents/children/:kidId/archive
 * Archiva (desactiva) un perfil de hijo asociado al padre logueado
 */
router.patch("/children/:kidId/archive", verifyToken, validateParams(archiveKidSchema), archiveChild);

/**
 * PATCH /api/parents/children/:kidId/unarchive
 * Desarchiva (reactiva) un perfil de hijo asociado al padre logueado
 */
router.patch("/children/:kidId/unarchive", verifyToken, validateParams(unarchiveKidSchema), unarchiveChild);

/**
 * GET /api/parents/profiles
 * Devuelve los perfiles disponibles del padre autenticado
 */
router.get("/profiles", verifyToken, getParentProfiles);

/* -------------------------------------------------------------------------- */
/*                       Sección: Dashboard de Padres                         */
/* -------------------------------------------------------------------------- */
/**
 * GET /api/parents/dashboard/children
 * Devuelve los hijos del padre autenticado (para mostrar en el dashboard)
 */
router.get("/dashboard/children", verifyToken, getChildrenForDashboard);

/**
 * GET /api/parents/dashboard/today-classes
 * Devuelve las clases del día actual (solo para hijos del padre logueado)
 */
router.get("/dashboard/today-classes", verifyToken, getTodayClasses);

/**
 * GET /api/parents/dashboard/next-classes
 * Devuelve las clases próximas (por defecto, 3 días siguientes)
 */
router.get("/dashboard/next-classes", verifyToken, getNextClasses);

/**
 * GET /api/parents/dashboard/feedback
 * Devuelve la retroalimentación de los maestros (pendiente de implementar)
 */
router.get("/dashboard/feedback", verifyToken, getFeedback);

/**
 * POST /api/parents/dashboard/add-note
 * Agrega una nota asociada a un hijo o clase (pendiente de implementar)
 */
router.post("/dashboard/add-note", verifyToken, addNote);

/* -------------------------------------------------------------------------- */
/*                              Exportación final                             */
/* -------------------------------------------------------------------------- */
export default router;
