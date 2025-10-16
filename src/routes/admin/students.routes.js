import { Router } from 'express';
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deactivateStudent,
  deleteStudent
} from '../../controllers/admin/students.controller.js';
import {
  validate,
  createStudentSchema,
  updateStudentSchema,
  deactivateStudentSchema
} from '../../validators/admin/students.schema.js';

const router = Router();

/**
 * @route   GET /api/admins/students
 * @desc    Obtener todos los estudiantes
 * @access  Admin
 * @note    La paginación y filtros se manejan en el frontend
 */
router.get(
  '/',
  getStudents
);

/**
 * @route   GET /api/admins/students/:id
 * @desc    Obtener un estudiante por ID con toda su información
 * @access  Admin
 * @param   {number} id - ID del estudiante
 */
router.get(
  '/:id',
  getStudent
);

/**
 * @route   POST /api/admins/students
 * @desc    Crear un nuevo estudiante
 * @access  Admin
 * @body    {number} parent_id - ID del padre (debe existir y tener rol 'padre')
 * @body    {string} name - Nombre del estudiante
 * @body    {string} birth_date - Fecha de nacimiento (formato: YYYY-MM-DD)
 * @body    {boolean} [is_solvent=false] - Estado de solvencia
 * @body    {object} [address] - Dirección del estudiante (opcional)
 */
router.post(
  '/',
  validate(createStudentSchema),
  createStudent
);

/**
 * @route   PUT /api/admins/students/:id
 * @desc    Actualizar información de un estudiante
 * @access  Admin
 * @param   {number} id - ID del estudiante
 * @body    {string} [name] - Nombre del estudiante
 * @body    {string} [birth_date] - Fecha de nacimiento
 * @body    {boolean} [is_solvent] - Estado de solvencia
 * @body    {number} [parent_id] - ID del padre
 */
router.put(
  '/:id',
  validate(updateStudentSchema),
  updateStudent
);

/**
 * @route   PATCH /api/admins/students/:id/deactivate
 * @desc    Desactivar un estudiante (soft delete)
 * @access  Admin
 * @param   {number} id - ID del estudiante
 * @body    {string} [reason] - Razón de la desactivación
 * @note    Esta acción marca al estudiante como no solvente, 
 *          cancela sus reservas futuras y agrega una nota explicativa
 */
router.patch(
  '/:id/deactivate',
  validate(deactivateStudentSchema),
  deactivateStudent
);

/**
 * @route   DELETE /api/admins/students/:id
 * @desc    Eliminar permanentemente un estudiante (hard delete)
 * @access  Admin
 * @param   {number} id - ID del estudiante
 * @warning Esta operación es irreversible y eliminará todos los datos relacionados
 */
router.delete(
  '/:id',
  deleteStudent
);

export default router;
