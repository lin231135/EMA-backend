import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';

const VALID_ROLES = ['admin', 'maestro', 'padre'];

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });

  try {
    // Coincide por email case-insensitive (aprovecha índice LOWER(email))
    const result = await db.query(
      `SELECT id, name, last_name, email, phone, password, role, is_active
       FROM "User"
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'Usuario desactivado, contacte al administrador' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'jwtsecret',
      { expiresIn: '4h' }
    );

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const register = async (req, res) => {
  const { name, last_name, prefix, phone, email, password, confirmPassword, role } = req.body;

  // Validación de campos obligatorios
  if (!name || !last_name || !prefix || !phone || !email || !password || !confirmPassword || !role) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  // Validación de contraseña y confirmación
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  }

  try {
    // Verificar si ya existe el email (case-insensitive)
    const check = await db.query('SELECT id FROM "User" WHERE LOWER(email) = LOWER($1)', [email]);
    if (check.rowCount > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Concatenar prefijo y teléfono
    const fullPhone = `${prefix}${phone}`;

    // Insertar usuario
    const insert = await db.query(
      `INSERT INTO "User"(name, last_name, phone, email, password, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, last_name, phone, email, role`,
      [name, last_name, fullPhone, email, hashedPassword, role]
    );

    const newUser = insert.rows[0];

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

export const updatePassword = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'userId, currentPassword y newPassword son obligatorios' });
  }

  try {
    const result = await db.query('SELECT password FROM "User" WHERE id = $1', [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE "User" SET password = $1 WHERE id = $2`,
      [hashedPassword, userId]
    );

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};