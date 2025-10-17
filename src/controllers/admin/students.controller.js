import pool from '../../db/connection.js';

// Alias para mantener consistencia con el resto del código
const db = pool;

/**
 * Crear un nuevo estudiante
 * POST /api/admins/students
 */
export const createStudent = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { parent_id, name, birth_date, is_solvent = false, address } = req.body;
    
    // Verificar que el padre existe y es un usuario con rol 'padre'
    const parentCheck = await client.query(
      'SELECT id, role FROM "User" WHERE id = $1 AND role = $2 AND is_active = TRUE',
      [parent_id, 'padre']
    );
    
    if (parentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        error: 'El padre especificado no existe o no tiene el rol correcto' 
      });
    }
    
    // Crear el estudiante (Kid)
    const studentResult = await client.query(
      `INSERT INTO Kid (parent_id, name, birth_date, is_solvent, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [parent_id, name, birth_date, is_solvent]
    );
    
    const student = studentResult.rows[0];
    
    // Si se proporciona dirección, crearla y asociarla
    if (address) {
      const addressResult = await client.query(
        `INSERT INTO Address (city, apartment, street_avenue, zone, house_number, neighborhood, municipality, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          address.city,
          address.apartment || null,
          address.street_avenue,
          address.zone,
          address.house_number,
          address.neighborhood,
          address.municipality,
          address.is_primary || false
        ]
      );
      
      const addressId = addressResult.rows[0].id;
      
      // Asociar dirección con el estudiante
      await client.query(
        'INSERT INTO Kid_Address (kid_id, address_id) VALUES ($1, $2)',
        [student.id, addressId]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Estudiante creado exitosamente',
      student
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear estudiante:', error);
    res.status(500).json({ error: 'Error al crear el estudiante' });
  } finally {
    client.release();
  }
};

/**
 * Obtener todos los estudiantes con información del padre
 * GET /api/admins/students
 * Nota: La paginación y filtros se manejan en el frontend
 */
export const getStudents = async (req, res) => {
  try {
    // Obtener todos los estudiantes con información básica
    const result = await db.query(
      `SELECT 
        k.id,
        'Estudiante' as role,
        k.name,
        k.is_active,
        k.created_at
       FROM Kid k
       ORDER BY k.created_at DESC`
    );
    
    res.status(200).json({
      students: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener los estudiantes' });
  }
};

/**
 * Obtener un estudiante por ID con información completa
 * GET /api/admins/students/:id
 */
export const getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información básica del estudiante
    const studentResult = await db.query(
      `SELECT 
        k.id,
        k.parent_id,
        k.name,
        k.birth_date,
        k.is_solvent,
        k.is_active,
        k.created_at,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone
       FROM Kid k
       LEFT JOIN "User" u ON k.parent_id = u.id
       WHERE k.id = $1`,
      [id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    const student = studentResult.rows[0];
    
    // Obtener direcciones del estudiante
    const addressesResult = await db.query(
      `SELECT 
        a.id,
        a.city,
        a.apartment,
        a.street_avenue,
        a.zone,
        a.house_number,
        a.neighborhood,
        a.municipality,
        a.is_primary
       FROM Address a
       INNER JOIN Kid_Address ka ON a.id = ka.address_id
       WHERE ka.kid_id = $1`,
      [id]
    );
    
    // Obtener reservas del estudiante
    const bookingsResult = await db.query(
      `SELECT 
        b.id,
        b.status,
        b.modality,
        s.schedule_date,
        s.start_time,
        s.end_time,
        c.name as course_name,
        c.modality as course_modality,
        t.name as teacher_name
       FROM Booking b
       INNER JOIN Schedule s ON b.schedule_id = s.id
       INNER JOIN Course c ON b.course_id = c.id
       LEFT JOIN "User" t ON b.teacher_id = t.id
       WHERE b.kid_id = $1
       ORDER BY s.schedule_date DESC, s.start_time DESC
       LIMIT 10`,
      [id]
    );
    
    // Obtener notas del estudiante
    const notesResult = await db.query(
      `SELECT 
        id,
        note,
        created_at
       FROM Notes
       WHERE kid_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [id]
    );
    
    // Construir respuesta completa
    const completeStudent = {
      id: student.id,
      role: 'Estudiante',
      name: student.name,
      birth_date: student.birth_date,
      is_solvent: student.is_solvent,
      is_active: student.is_active,
      created_at: student.created_at,
      parent: student.parent_id ? {
        id: student.parent_id,
        name: student.parent_name,
        email: student.parent_email,
        phone: student.parent_phone
      } : null,
      addresses: addressesResult.rows,
      bookings: bookingsResult.rows,
      notes: notesResult.rows
    };
    
    res.status(200).json({ student: completeStudent });
    
  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    res.status(500).json({ error: 'Error al obtener el estudiante' });
  }
};

/**
 * Actualizar información de un estudiante
 * PUT /api/admins/students/:id
 */
export const updateStudent = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, birth_date, is_solvent, parent_id } = req.body;
    
    // Verificar que el estudiante existe
    const studentCheck = await client.query('SELECT id FROM Kid WHERE id = $1', [id]);
    
    if (studentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    // Si se cambia el padre, verificar que existe y es un padre
    if (parent_id) {
      const parentCheck = await client.query(
        'SELECT id FROM "User" WHERE id = $1 AND role = $2 AND is_active = TRUE',
        [parent_id, 'padre']
      );
      
      if (parentCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          error: 'El padre especificado no existe o no tiene el rol correcto' 
        });
      }
    }
    
    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    let valueIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${valueIndex}`);
      values.push(name);
      valueIndex++;
    }
    
    if (birth_date !== undefined) {
      updates.push(`birth_date = $${valueIndex}`);
      values.push(birth_date);
      valueIndex++;
    }
    
    if (is_solvent !== undefined) {
      updates.push(`is_solvent = $${valueIndex}`);
      values.push(is_solvent);
      valueIndex++;
    }
    
    if (parent_id !== undefined) {
      updates.push(`parent_id = $${valueIndex}`);
      values.push(parent_id);
      valueIndex++;
    }
    
    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }
    
    values.push(id);
    
    const result = await client.query(
      `UPDATE Kid SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
      values
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Estudiante actualizado exitosamente',
      student: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar estudiante:', error);
    res.status(500).json({ error: 'Error al actualizar el estudiante' });
  } finally {
    client.release();
  }
};

/**
 * Desactivar un estudiante (soft delete)
 * PATCH /api/admins/students/:id/deactivate
 * Marca is_active = FALSE, cancela reservas futuras y agrega nota
 */
export const deactivateStudent = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { reason } = req.body;
    
    // Verificar que el estudiante existe
    const studentCheck = await client.query(
      'SELECT id, name, is_active FROM Kid WHERE id = $1',
      [id]
    );
    
    if (studentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    if (!studentCheck.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El estudiante ya está desactivado' });
    }
    
    // Desactivar el estudiante
    await client.query(
      'UPDATE Kid SET is_active = FALSE WHERE id = $1',
      [id]
    );
    
    // Cancelar todas las reservas futuras del estudiante
    const cancelResult = await client.query(
      `UPDATE Booking 
       SET status = 'cancelada'
       WHERE kid_id = $1 
       AND status = 'programada'
       AND schedule_id IN (
         SELECT id FROM Schedule WHERE schedule_date >= CURRENT_DATE
       )
       RETURNING id`,
      [id]
    );
    
    // Agregar nota explicativa
    const noteText = reason 
      ? `Cuenta desactivada. Razón: ${reason}` 
      : 'Cuenta desactivada. Desactivación administrativa';
    
    await client.query(
      'INSERT INTO Notes (kid_id, note, created_at) VALUES ($1, $2, NOW())',
      [id, noteText]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Estudiante desactivado exitosamente',
      student: {
        id: studentCheck.rows[0].id,
        name: studentCheck.rows[0].name,
        is_active: false
      },
      cancelled_bookings: cancelResult.rowCount
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al desactivar estudiante:', error);
    res.status(500).json({ error: 'Error al desactivar el estudiante' });
  } finally {
    client.release();
  }
};

/**
 * Reactivar un estudiante
 * PATCH /api/admins/students/:id/reactivate
 * Marca is_active = TRUE y agrega nota explicativa
 */
export const reactivateStudent = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { reason } = req.body;
    
    // Verificar que el estudiante existe
    const studentCheck = await client.query(
      'SELECT id, name, is_active FROM Kid WHERE id = $1',
      [id]
    );
    
    if (studentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    if (studentCheck.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El estudiante ya está activo' });
    }
    
    // Reactivar el estudiante
    await client.query(
      'UPDATE Kid SET is_active = TRUE WHERE id = $1',
      [id]
    );
    
    // Agregar nota explicativa
    const noteText = reason 
      ? `Cuenta reactivada. Razón: ${reason}` 
      : 'Cuenta reactivada. Reactivación administrativa';
    
    await client.query(
      'INSERT INTO Notes (kid_id, note, created_at) VALUES ($1, $2, NOW())',
      [id, noteText]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Estudiante reactivado exitosamente',
      student: {
        id: studentCheck.rows[0].id,
        name: studentCheck.rows[0].name,
        is_active: true
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al reactivar estudiante:', error);
    res.status(500).json({ error: 'Error al reactivar el estudiante' });
  } finally {
    client.release();
  }
};

/**
 * Eliminar un estudiante permanentemente (hard delete)
 * DELETE /api/admins/students/:id
 * ADVERTENCIA: Esta operación eliminará permanentemente todos los datos relacionados
 */
export const deleteStudent = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Verificar que el estudiante existe
    const studentCheck = await client.query(
      'SELECT id, name FROM Kid WHERE id = $1',
      [id]
    );
    
    if (studentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    const studentName = studentCheck.rows[0].name;
    
    // Eliminar el estudiante (CASCADE eliminará automáticamente registros relacionados)
    await client.query('DELETE FROM Kid WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: `Estudiante "${studentName}" eliminado permanentemente`,
      deleted_id: id
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({ error: 'Error al eliminar el estudiante' });
  } finally {
    client.release();
  }
};
