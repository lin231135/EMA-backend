import db from '../db/connection.js';

const mapUser = (row) => ({
  id: row.id,
  name: row.name,
  last_name: row.last_name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  description: row.description,
  is_active: row.is_active,
});

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, last_name, phone, description } = req.body;

  if (req.user.id !== Number(id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    const userResult = await db.query('SELECT role FROM "User" WHERE id = $1', [id]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (description !== undefined && userResult.rows[0].role !== 'maestro') {
      return res.status(400).json({ message: 'Solo los maestros tienen descripción' });
    }

    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (last_name !== undefined) { fields.push(`last_name = $${idx++}`); values.push(last_name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    values.push(id);

    const result = await db.query(
      `UPDATE "User" SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, last_name, email, phone, role, description, is_active`,
      values
    );

    return res.status(200).json({ user: mapUser(result.rows[0]) });
  } catch (error) {
    console.error('updateUser error', error);
    return res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

export const setActive = (active) => async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    const result = await db.query(
      `UPDATE "User" SET is_active = $1 WHERE id = $2 RETURNING id, name, last_name, email, phone, role, description, is_active`,
      [active, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ user: mapUser(result.rows[0]) });
  } catch (error) {
    console.error('setActive error', error);
    return res.status(500).json({ message: 'Error al actualizar estado' });
  }
};
