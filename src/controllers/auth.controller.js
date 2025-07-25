import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.last_name, u.email, u.password, u.is_first_login ,r.role 
       FROM Users u
       JOIN Role r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
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
        role: user.role,
        is_first_login: user.is_first_login
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const register = async (req, res) => {
  const { name, last_name, phone, email, password, role } = req.body;

  try {
    // Verificar si ya existe el email
    const check = await db.query('SELECT id FROM Users WHERE email = $1', [email]);
    if (check.rowCount > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Obtener el ID del rol por nombre
    const roleQuery = await db.query('SELECT id FROM Role WHERE role = $1', [role]);
    if (roleQuery.rowCount === 0) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const role_id = roleQuery.rows[0].id;

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const insert = await db.query(
      `INSERT INTO Users (name, last_name, phone, email, password, role_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, last_name, email`,
      [name, last_name, phone, email, hashedPassword, role_id]
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

  try {
    const result = await db.query('SELECT password FROM Users WHERE id = $1', [userId]);

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
      `UPDATE Users SET password = $1, is_first_login = FALSE WHERE id = $2`,
      [hashedPassword, userId]
    );

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
