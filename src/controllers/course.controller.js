// src/controllers/course.controller.js
import db from '../db/connection.js';

// Utilidad para mapear curso
const mapCourse = (row) => ({
  id: row.id,
  name: row.name,
  teacher_id: row.teacher_id,
  modality: row.modality,
  capacity: row.capacity,
  cost: row.cost,
  is_active: row.is_active,
  created_at: row.created_at
});

// Crear curso
export const createCourse = async (req, res) => {
  const { name, teacher_id, modality, capacity, cost } = req.body;

  if (!name || !teacher_id || !modality || !capacity || !cost) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await db.query(
      `INSERT INTO Course (name, teacher_id, modality, capacity, cost)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, teacher_id, modality, capacity, cost]
    );
    return res.status(201).json({ course: mapCourse(result.rows[0]) });
  } catch (error) {
    console.error('createCourse error', error);
    return res.status(500).json({ message: 'Error al crear curso' });
  }
};

// Listar todos
export const getCourses = async (_req, res) => {
  try {
    const result = await db.query('SELECT * FROM Course ORDER BY id ASC');
    return res.status(200).json({ courses: result.rows.map(mapCourse) });
  } catch (error) {
    console.error('getCourses error', error);
    return res.status(500).json({ message: 'Error al obtener cursos' });
  }
};

// Obtener por id
export const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM Course WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Curso no encontrado' });
    return res.status(200).json({ course: mapCourse(result.rows[0]) });
  } catch (error) {
    console.error('getCourseById error', error);
    return res.status(500).json({ message: 'Error al obtener curso' });
  }
};

// Actualizar
export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name, teacher_id, modality, capacity, cost, is_active } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (teacher_id !== undefined) { fields.push(`teacher_id = $${idx++}`); values.push(teacher_id); }
    if (modality !== undefined) { fields.push(`modality = $${idx++}`); values.push(modality); }
    if (capacity !== undefined) { fields.push(`capacity = $${idx++}`); values.push(capacity); }
    if (cost !== undefined) { fields.push(`cost = $${idx++}`); values.push(cost); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (fields.length === 0) return res.status(400).json({ message: 'No hay campos para actualizar' });

    values.push(id);

    const result = await db.query(
      `UPDATE Course SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rowCount === 0) return res.status(404).json({ message: 'Curso no encontrado' });

    return res.status(200).json({ course: mapCourse(result.rows[0]) });
  } catch (error) {
    console.error('updateCourse error', error);
    return res.status(500).json({ message: 'Error al actualizar curso' });
  }
};

// Eliminar
export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM Course WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Curso no encontrado' });
    return res.status(200).json({ message: 'Curso eliminado correctamente' });
  } catch (error) {
    console.error('deleteCourse error', error);
    return res.status(500).json({ message: 'Error al eliminar curso' });
  }
};
