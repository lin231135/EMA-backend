import pool from '../db/connection.js';
import imagekit from '../config/imagekit.js';

const mapUser = (row) => ({
  id: row.id,
  name: row.name,
  last_name: row.last_name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  description: row.description,
  is_active: row.is_active,
  profile_image: row.profile_image, 
});

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, last_name, phone, description } = req.body;

  if (req.user.id !== Number(id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    const userResult = await pool.query('SELECT role FROM "User" WHERE id = $1', [id]);
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

    const result = await pool.query(
      `UPDATE "User" SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, last_name, email, phone, role, description, is_active, profile_image`,
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
    const result = await pool.query(
      `UPDATE "User" SET is_active = $1 WHERE id = $2 RETURNING id, name, last_name, email, phone, role, description, is_active, profile_image`,
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

// Acá empieza todo lo de Profile

/* FUNCIONES PARA ROL ADMIN, MAESTRO Y PADRE */

// Get profile info for the current user
export const getProfileInfo = async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, name, last_name, role, email, phone, is_active, profile_image FROM "User" WHERE id = $1',
      [req.user.id]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const addressResult = await pool.query(
      `SELECT a.id, a.city, a.apartment, a.street_avenue, a.zone, a.house_number, a.neighborhood, a.municipality, a.is_primary
         FROM Address a
         JOIN User_Address ua ON ua.address_id = a.id
        WHERE ua.user_id = $1
        ORDER BY a.is_primary DESC, a.id`,
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
  const { name, last_name, phone, email } = req.body;
  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (name !== undefined)      { fields.push(`name = $${i++}`);       values.push(name); }
    if (last_name !== undefined) { fields.push(`last_name = $${i++}`);  values.push(last_name); }
    if (phone !== undefined)     { fields.push(`phone = $${i++}`);      values.push(phone); }
    if (email !== undefined)     { fields.push(`email = $${i++}`);      values.push(email); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    values.push(req.user.id); // último parámetro: id
    const sql = `
      UPDATE "User"
      SET ${fields.join(', ')}
      WHERE id = $${i}
      RETURNING id, name, last_name, role, email, phone, is_active, profile_image
    `;
    const result = await pool.query(sql, values);

    return res.status(200).json({ user: mapUser(result.rows[0]) });
  } catch (error) {
    console.error('updateProfileInfo error', error);
    return res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

// Upload/Update profile image
export const uploadProfileImage = async (req, res) => {
  try {
    const { file } = req.body; // Base64 encoded image
    
    if (!file) {
      return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
    }

    // Get current user to check if they have an existing image
    const userResult = await pool.query(
      'SELECT profile_image FROM "User" WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const currentImage = userResult.rows[0].profile_image;

    // Delete old image from ImageKit if exists
    if (currentImage) {
      try {
        // Extract fileId from URL
        const urlParts = currentImage.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const fileIdWithExt = fileName.split('?')[0]; // Remove query params if any
        const fileId = fileIdWithExt.substring(0, fileIdWithExt.lastIndexOf('.')) || fileIdWithExt;
        
        await imagekit.deleteFile(fileId);
      } catch (deleteError) {
        console.error('Error deleting old image:', deleteError);
        // Continue even if delete fails
      }
    }

    // Upload new image to ImageKit
    const uploadResponse = await imagekit.upload({
      file: file, // Base64 string
      fileName: `profile_${req.user.id}_${Date.now()}`,
      folder: '/profiles',
      useUniqueFileName: true,
      tags: [`user_${req.user.id}`, 'profile']
    });

    // Update user profile_image in database
    const updateResult = await pool.query(
      'UPDATE "User" SET profile_image = $1 WHERE id = $2 RETURNING id, name, last_name, role, email, phone, is_active, profile_image',
      [uploadResponse.url, req.user.id]
    );

    return res.status(200).json({
      user: mapUser(updateResult.rows[0]),
      imageUrl: uploadResponse.url
    });
  } catch (error) {
    console.error('uploadProfileImage error', error);
    return res.status(500).json({ 
      message: 'Error al subir imagen de perfil',
      error: error.message 
    });
  }
};

// Delete profile image
export const deleteProfileImage = async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT profile_image FROM "User" WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const currentImage = userResult.rows[0].profile_image;

    if (!currentImage) {
      return res.status(400).json({ message: 'No hay imagen de perfil para eliminar' });
    }

    // Delete from ImageKit
    try {
      const urlParts = currentImage.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const fileIdWithExt = fileName.split('?')[0];
      const fileId = fileIdWithExt.substring(0, fileIdWithExt.lastIndexOf('.')) || fileIdWithExt;
      
      await imagekit.deleteFile(fileId);
    } catch (deleteError) {
      console.error('Error deleting from ImageKit:', deleteError);
    }

    // Update database
    const updateResult = await pool.query(
      'UPDATE "User" SET profile_image = NULL WHERE id = $1 RETURNING id, name, last_name, role, email, phone, is_active, profile_image',
      [req.user.id]
    );

    return res.status(200).json({
      user: mapUser(updateResult.rows[0]),
      message: 'Imagen de perfil eliminada correctamente'
    });
  } catch (error) {
    console.error('deleteProfileImage error', error);
    return res.status(500).json({ message: 'Error al eliminar imagen de perfil' });
  }
};

//  Create a new address for the current user
export const createAddress = async (req, res) => {
  const {
    city,
    apartment,
    street_avenue,
    zone,
    house_number,
    neighborhood,
    municipality,
    is_primary = false,
  } = req.body;

  // Requeridos según el esquema
  if (!city || !street_avenue || !zone || !house_number || !neighborhood || !municipality) {
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }

  const client = await pool.connect();
  try {
    const q = client ? client.query.bind(client) : pool.query.bind(pool);

    if (client) await q('BEGIN');

    const insertAddress = `
      INSERT INTO Address (city, apartment, street_avenue, zone, house_number, neighborhood, municipality, is_primary)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const addrRes = await q(insertAddress, [
      city,
      apartment ?? null,
      street_avenue,
      zone,
      house_number,
      neighborhood,
      municipality,
      Boolean(is_primary),
    ]);
    const address = addrRes.rows[0];

    // Asociar al usuario actual
    await q(
      `INSERT INTO User_Address (user_id, address_id) VALUES ($1, $2)`,
      [req.user.id, address.id]
    );

    // Si es primaria, desmarcar otras primarias del mismo usuario
    if (address.is_primary === true) {
      await q(
        `UPDATE Address
           SET is_primary = FALSE
         WHERE id IN (
           SELECT address_id FROM User_Address
           WHERE user_id = $1 AND address_id <> $2
         )`,
        [req.user.id, address.id]
      );
    }

    if (client) await q('COMMIT');
    return res.status(201).json({ address });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('createAddress error', error);
    return res.status(500).json({ message: 'Error al crear dirección' });
  } finally {
    if (client) client.release();
  }
};

// Actualizar una dirección por id (si pertenece al usuario actual)
export const updateAddressById = async (req, res) => {
  const addressId = Number(req.params.id);
  if (!Number.isInteger(addressId) || addressId <= 0) {
    return res.status(400).json({ message: 'ID de dirección inválido' });
  }

  const {
    city,
    apartment,
    street_avenue,
    zone,
    house_number,
    neighborhood,
    municipality,
    is_primary,
  } = req.body;

  const fields = [];
  const values = [];
  let i = 1;

  if (city !== undefined) { fields.push(`city = $${i++}`); values.push(city); }
  if (apartment !== undefined) { fields.push(`apartment = $${i++}`); values.push(apartment); }
  if (street_avenue !== undefined) { fields.push(`street_avenue = $${i++}`); values.push(street_avenue); }
  if (zone !== undefined) { fields.push(`zone = $${i++}`); values.push(zone); }
  if (house_number !== undefined) { fields.push(`house_number = $${i++}`); values.push(house_number); }
  if (neighborhood !== undefined) { fields.push(`neighborhood = $${i++}`); values.push(neighborhood); }
  if (municipality !== undefined) { fields.push(`municipality = $${i++}`); values.push(municipality); }
  if (is_primary !== undefined) { fields.push(`is_primary = $${i++}`); values.push(Boolean(is_primary)); }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'No hay campos para actualizar' });
  }

  const client = await pool.connect();
  try {
    const q = client ? client.query.bind(client) : pool.query.bind(pool);
    if (client) await q('BEGIN');

    // Verificar que la dirección pertenezca al usuario
    const ownRes = await q(
      `SELECT 1 FROM User_Address WHERE user_id = $1 AND address_id = $2`,
      [req.user.id, addressId]
    );
    if (ownRes.rowCount === 0) {
      if (client) await q('ROLLBACK');
      return res.status(404).json({ message: 'Dirección no encontrada para este usuario' });
    }

    const updateSql = `
      UPDATE Address SET ${fields.join(', ')} WHERE id = $${i}
      RETURNING *
    `;
    const updRes = await q(updateSql, [...values, addressId]);
    if (updRes.rowCount === 0) {
      if (client) await q('ROLLBACK');
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    const address = updRes.rows[0];

    // Si se marcó como primaria, desmarcar las demás del usuario
    if (req.body.is_primary === true) {
      await q(
        `UPDATE Address
           SET is_primary = FALSE
         WHERE id IN (
           SELECT address_id FROM User_Address
           WHERE user_id = $1 AND address_id <> $2
         )`,
        [req.user.id, addressId]
      );
    }

    if (client) await q('COMMIT');
    return res.status(200).json({ address });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('updateAddressById error', error);
    return res.status(500).json({ message: 'Error al actualizar dirección' });
  } finally {
    if (client) client.release();
  }
};

// CRUD de Users (solo admin/sup)

// Add a new user
export const addUser = async (req, res) => {
  const { name, last_name, email, phone, role, description } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  if (!name || !last_name || !email || !phone || !role) {
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }
  if (description !== undefined && role !== 'maestro') {
    return res.status(400).json({ message: 'Solo los maestros tienen descripción' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO "User" (name, last_name, email, phone, role, description, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        RETURNING id, name, last_name, email, phone, role, description, is_active, profile_image`,
      [name, last_name, email, phone, role, description || null]
    );
    return res.status(201).json({ user: mapUser(result.rows[0]) });
  } catch (error) {
    console.error('addUser error', error);
    return res.status(500).json({ message: 'Error al crear usuario' });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = `SELECT id, name, last_name, email, phone, role, description, is_active, profile_image FROM "User"`;
    const params = [];
    
    // Filtrar por rol si se proporciona
    if (role) {
      query += ` WHERE role = $1`;
      params.push(role);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await pool.query(query, params);
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
    const result = await pool.query(
      `SELECT id, name, last_name, email, phone, role, description, is_active, profile_image FROM "User" WHERE id = $1`,
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
    const result = await pool.query(
      `DELETE FROM "User" WHERE id = $1 RETURNING id, name, last_name, email, phone, role, description, is_active, profile_image`,
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