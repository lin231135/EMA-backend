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

// Get profile info for the current user
export const getProfileInfo = async (req, res) => {
  try {
    // Get user basic info
    const userResult = await db.query(
      'SELECT id, name, last_name, email, phone, role, description, is_active FROM "User" WHERE id = $1',
      [req.user.id]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    // Get addresses
    const addressResult = await db.query(
      'SELECT id, address_line, city, zone, is_primary FROM Address WHERE user_id = $1',
      [req.user.id]
    );
    return res.status(200).json({
      user: mapUser(userResult.rows[0]),
      addresses: addressResult.rows
    });
  } catch (error) {
    console.error('getProfileInfo error', error);
    return res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

// Update profile info for the current user
export const updateProfileInfo = async (req, res) => {
  const { name, last_name, phone, description } = req.body;
  try {
    // Only allow description update if user is maestro
    if (description !== undefined && req.user.role !== 'maestro') {
      return res.status(400).json({ message: 'Solo los maestros tienen descripción' });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (last_name !== undefined) { fields.push(`last_name = $${idx++}`); values.push(last_name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }
    values.push(req.user.id);
    const result = await db.query(
      `UPDATE "User" SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, last_name, email, phone, role, description, is_active`,
      values
    );
    return res.status(200).json({ user: mapUser(result.rows[0]) });
  } catch (error) {
    console.error('updateProfileInfo error', error);
    return res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

// Update or add address for the current user
export const updateAddress = async (req, res) => {
  const { id, address_line, city, zone, is_primary } = req.body;
  try {
    let address;
    if (id) {
      // Update existing address
      const fields = [];
      const values = [];
      let idx = 1;
      if (address_line !== undefined) { fields.push(`address_line = $${idx++}`); values.push(address_line); }
      if (city !== undefined) { fields.push(`city = $${idx++}`); values.push(city); }
      if (zone !== undefined) { fields.push(`zone = $${idx++}`); values.push(zone); }
      if (is_primary !== undefined) { fields.push(`is_primary = $${idx++}`); values.push(is_primary); }
      if (fields.length === 0) {
        return res.status(400).json({ message: 'No hay campos para actualizar' });
      }
      values.push(id, req.user.id);
      const result = await db.query(
        `UPDATE Address SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
        values
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Dirección no encontrada' });
      }
      address = result.rows[0];
    } else {
      // Add new address
      const result = await db.query(
        `INSERT INTO Address (user_id, address_line, city, zone, is_primary)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.user.id, address_line, city, zone, is_primary || false]
      );
      address = result.rows[0];
    }
    // If set as primary, unset other addresses as primary
    if (address.is_primary) {
      await db.query(
        `UPDATE Address SET is_primary = FALSE WHERE user_id = $1 AND id <> $2`,
        [req.user.id, address.id]
      );
    }
    return res.status(200).json({ address });
  } catch (error) {
    console.error('updateAddress error', error);
    return res.status(500).json({ message: 'Error al actualizar/agregar dirección' });
  }
};

// Add a new user
export const addUser = async (req, res) => {
  const { name, last_name, email, phone, password, role, description } = req.body;
  try {
    // Only maestros can have description
    if (description && role !== 'maestro') {
      return res.status(400).json({ message: 'Solo los maestros pueden tener descripción' });
    }
    const result = await db.query(
      `INSERT INTO "User" (name, last_name, email, phone, password, role, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, last_name, email, phone, role, description, is_active`,
      [name, last_name, email, phone, password, role, description || null]
    );
    return res.status(201).json({ user: mapUser(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') { // unique_violation
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    console.error('addUser error', error);
    return res.status(500).json({ message: 'Error al crear usuario' });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, last_name, email, phone, role, description, is_active FROM "User"`
    );
    return res.status(200).json({ users: result.rows.map(mapUser) });
  } catch (error) {
    console.error('getUsers error', error);
    return res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Get a single user by ID
export const getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT id, name, last_name, email, phone, role, description, is_active FROM "User" WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.status(200).json({ user: mapUser(result.rows[0]) });
  } catch (error) {
    console.error('getUser error', error);
    return res.status(500).json({ message: 'Error al obtener usuario' });
  }
};


// Delete a user by ID
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  try {
    const result = await db.query(
      `DELETE FROM "User" WHERE id = $1 RETURNING id, name, last_name, email, phone, role, description, is_active`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.status(200).json({ message: 'Usuario eliminado correctamente', user: mapUser(result.rows[0]) });
  } catch (error) {
    console.error('deleteUser error', error);
    return res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

