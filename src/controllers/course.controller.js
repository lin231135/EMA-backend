// src/controllers/course.controller.js
import db from '../db/connection.js';

/**
 * Controlador para crear un nuevo curso
 * @route POST /api/courses
 * @access Privado - Solo Admin
 */
export async function createCourse(req, res) {
  try {
    const { name, modality, capacity, cost, is_active = true } = req.body;

    // Verificar si ya existe un curso con el mismo nombre y modalidad
    const existingCourse = await db.query(
      `SELECT id, name, modality 
       FROM Course 
       WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) 
       AND modality = $2 
       AND is_active = TRUE`,
      [name, modality]
    );

    if (existingCourse.rows.length > 0) {
      return res.status(409).json({
        error: 'Conflicto',
        message: `Ya existe un curso activo con el nombre "${name}" en modalidad "${modality}"`
      });
    }

    // Insertar el nuevo curso
    const result = await db.query(
      `INSERT INTO Course (name, modality, capacity, cost, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, modality, capacity, cost, is_active, created_at`,
      [name, modality, capacity, cost, is_active]
    );

    const newCourse = result.rows[0];

    return res.status(201).json({
      message: 'Curso creado exitosamente',
      course: {
        id: newCourse.id,
        name: newCourse.name,
        modality: newCourse.modality,
        capacity: newCourse.capacity,
        cost: parseFloat(newCourse.cost),
        is_active: newCourse.is_active,
        created_at: newCourse.created_at
      }
    });

  } catch (error) {
    console.error('Error al crear curso:', error);

    // Error de tipo de dato inválido en PostgreSQL
    if (error.code === '22P02') {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Uno o más campos contienen datos en formato incorrecto'
      });
    }

    // Error de violación de constraint (por si acaso)
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflicto',
        message: 'El curso ya existe en el sistema'
      });
    }

    // Error genérico del servidor
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al crear el curso'
    });

  }
};
