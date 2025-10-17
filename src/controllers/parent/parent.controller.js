import db from '../../db/connection.js';

/* FUNCIONES PARA EL DASHBOARD DEL PADRE */

// Add a note for a student or class
export const addNote = async (req, res) => {
  // TODO: Implement logic to add a note
};

// Get feedback for a student or class
export const getFeedback = async (req, res) => {
  // TODO: Implement logic to get feedback
};

// Get today's classes for a student
export const getTodayClasses = async (req, res) => {
  // TODO: Implement logic to get today's classes
};

// Get next/upcoming classes for a student
export const getNextClasses = async (req, res) => {
  // TODO: Implement logic to get next classes
};

/* FUNCIONES PARA QUE EL PADRE ACTUALICE PROFILE DE SUS HIJOS */


// verificar si es necesario validar que si el padre tambien es un kid
// validar que no tenga una direccione n User_address y otra diferente en Kid_address
// para proteger la integridad de los datos

// Get kid profile + addresses (parent only for own kid)
export const getKidProfileInfo = async (req, res) => {
  const kidId = Number(req.params.kidId);
  if (!Number.isInteger(kidId) || kidId <= 0) return res.status(400).json({ message: 'kidId inválido' });
  try {
    // Owner check
    const own = await db.query('SELECT id, name, parent_id, birth_date, is_solvent, is_active FROM Kid WHERE id = $1 AND parent_id = $2', [kidId, req.user.id]);
    if (own.rowCount === 0) return res.status(404).json({ message: 'Hijo no encontrado' });

    const addresses = await db.query(
      `SELECT a.id, a.city, a.apartment, a.street_avenue, a.zone, a.house_number, a.neighborhood, a.municipality, a.is_primary
         FROM Address a
         JOIN Kid_Address ka ON ka.address_id = a.id
        WHERE ka.kid_id = $1
        ORDER BY a.is_primary DESC, a.id`,
      [kidId]
    );

    return res.status(200).json({ kid: own.rows[0], addresses: addresses.rows });
  } catch (err) {
    console.error('getKidProfileInfo error', err);
    return res.status(500).json({ message: 'Error al obtener información del hijo' });
  }
};

// Create a new address and link it to a kid (parent must own the kid)
export const createKidAddress = async (req, res) => {
  // traer el id del hijo
  const kidId = Number(req.params.kidId);
  if (!Number.isInteger(kidId) || kidId <= 0) return res.status(400).json({ message: 'kidId inválido' });

  // traer los datos de la dirección del body
  const { city, apartment, street_avenue, zone, house_number, neighborhood, municipality, is_primary = false } = req.body;
  if (!city || !street_avenue || !zone || !house_number || !neighborhood || !municipality) {
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }

  const client = await db.pool?.connect?.() ?? null;

  try {
    const q = client ? client.query.bind(client) : db.query.bind(db);
    if (client) await q('BEGIN');

    // Buscar al hijo
    const own = await q('SELECT 1 FROM Kid WHERE id = $1 AND parent_id = $2', [kidId, req.user.id]);
    if (own.rowCount === 0) {
      if (client) await q('ROLLBACK');
      return res.status(404).json({ message: 'Hijo no encontrado' });
    }

    // Crear la nueva dirección
    const ins = await q(
      `INSERT INTO Address (city, apartment, street_avenue, zone, house_number, neighborhood, municipality, is_primary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [city, apartment ?? null, street_avenue, zone, house_number, neighborhood, municipality, Boolean(is_primary)]
    );
    const address = ins.rows[0];

    // Vincular la dirección al hijo
    await q(`INSERT INTO Kid_Address (kid_id, address_id) VALUES ($1,$2)`, [kidId, address.id]);

    // Si la direccion se colocó como primaria, actualizar las otras a false
    if (address.is_primary) {
      await q(
        `UPDATE Address SET is_primary = FALSE
          WHERE id IN (SELECT address_id FROM Kid_Address WHERE kid_id = $1 AND address_id <> $2)`,
        [kidId, address.id]
      );
    }

    if (client) await q('COMMIT');
    return res.status(201).json({ address });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('createKidAddress error', err);
    return res.status(500).json({ message: 'Error al crear dirección del hijo' });
  } finally {
    if (client) client.release?.();
  }
};

// Update a kid address by id (only if linked to that kid and parent owns the kid)
export const updateKidAddressById = async (req, res) => {
  const kidId = Number(req.params.kidId);
  const addressId = Number(req.params.addressId);
  if (!Number.isInteger(kidId) || kidId <= 0 || !Number.isInteger(addressId) || addressId <= 0) {
    return res.status(400).json({ message: 'IDs inválidos' });
  }

  const { city, apartment, street_avenue, zone, house_number, neighborhood, municipality, is_primary } = req.body;

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
  if (fields.length === 0) return res.status(400).json({ message: 'No hay campos para actualizar' });

  const client = await db.pool?.connect?.() ?? null;
  try {
    const q = client ? client.query.bind(client) : db.query.bind(db);
    if (client) await q('BEGIN');

    // Owner + link check
    const own = await q('SELECT 1 FROM Kid WHERE id = $1 AND parent_id = $2', [kidId, req.user.id]);
    if (own.rowCount === 0) {
      if (client) await q('ROLLBACK');
      return res.status(404).json({ message: 'Hijo no encontrado' });
    }
    const linked = await q('SELECT 1 FROM Kid_Address WHERE kid_id = $1 AND address_id = $2', [kidId, addressId]);
    if (linked.rowCount === 0) {
      if (client) await q('ROLLBACK');
      return res.status(404).json({ message: 'La dirección no está asociada a este hijo' });
    }

    const upd = await q(`UPDATE Address SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, [...values, addressId]);
    if (upd.rowCount === 0) {
      if (client) await q('ROLLBACK');
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    const address = upd.rows[0];

    if (req.body.is_primary === true) {
      await q(
        `UPDATE Address SET is_primary = FALSE
          WHERE id IN (SELECT address_id FROM Kid_Address WHERE kid_id = $1 AND address_id <> $2)`,
        [kidId, addressId]
      );
    }

    if (client) await q('COMMIT');
    return res.status(200).json({ address });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('updateKidAddressById error', err);
    return res.status(500).json({ message: 'Error al actualizar dirección del hijo' });
  } finally {
    if (client) client.release?.();
  }
};

// Link a kid to an existing address (e.g., reuse parent’s address)
export const linkKidToExistingAddress = async (req, res) => {
  const kidId = Number(req.params.kidId);
  const { address_id, is_primary = false } = req.body;
  if (!Number.isInteger(kidId) || kidId <= 0 || !Number.isInteger(Number(address_id))) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }
  try {
    // Owner check
    const own = await db.query('SELECT 1 FROM Kid WHERE id = $1 AND parent_id = $2', [kidId, req.user.id]);
    if (own.rowCount === 0) return res.status(404).json({ message: 'Hijo no encontrado' });

    // Optionally ensure the parent owns or can use that address
    const parentHas = await db.query(
      'SELECT 1 FROM User_Address WHERE user_id = $1 AND address_id = $2',
      [req.user.id, address_id]
    );
    if (parentHas.rowCount === 0) return res.status(403).json({ message: 'No puedes vincular una dirección que no es tuya' });

    await db.query('INSERT INTO Kid_Address (kid_id, address_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [kidId, address_id]);

    if (is_primary === true) {
      await db.query(
        `UPDATE Address SET is_primary = FALSE
           WHERE id IN (SELECT address_id FROM Kid_Address WHERE kid_id = $1 AND address_id <> $2)`,
        [kidId, address_id]
      );
      await db.query('UPDATE Address SET is_primary = TRUE WHERE id = $1', [address_id]);
    }

    return res.status(201).json({ message: 'Dirección vinculada' });
  } catch (err) {
    console.error('linkKidToExistingAddress error', err);
    return res.status(500).json({ message: 'Error al vincular dirección' });
  }
};

// Unlink a kid from an address (and optionally delete if no longer referenced)
export const unlinkKidAddress = async (req, res) => {
  const kidId = Number(req.params.kidId);
  const addressId = Number(req.params.addressId);
  if (!Number.isInteger(kidId) || kidId <= 0 || !Number.isInteger(addressId) || addressId <= 0) {
    return res.status(400).json({ message: 'IDs inválidos' });
  }
  try {
    const own = await db.query('SELECT 1 FROM Kid WHERE id = $1 AND parent_id = $2', [kidId, req.user.id]);
    if (own.rowCount === 0) return res.status(404).json({ message: 'Hijo no encontrado' });

    const del = await db.query('DELETE FROM Kid_Address WHERE kid_id = $1 AND address_id = $2', [kidId, addressId]);
    if (del.rowCount === 0) return res.status(404).json({ message: 'Relación no encontrada' });

    // Opcional: borrar Address si quedó huérfana
    await db.query(
      `DELETE FROM Address a
         WHERE a.id = $1
           AND NOT EXISTS (SELECT 1 FROM User_Address ua WHERE ua.address_id = a.id)
           AND NOT EXISTS (SELECT 1 FROM Kid_Address ka WHERE ka.address_id = a.id)`,
      [addressId]
    );

    return res.status(200).json({ message: 'Dirección desvinculada' });
  } catch (err) {
    console.error('unlinkKidAddress error', err);
    return res.status(500).json({ message: 'Error al desvincular dirección' });
  }
};