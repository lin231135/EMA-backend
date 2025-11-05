// src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';      // Librería para hash y comparación segura de contraseñas
import jwt from 'jsonwebtoken';     // Librería para generación y verificación de JSON Web Tokens
import db from '../db/connection.js'; // Pool de conexión a PostgreSQL

/**
 * POST /api/auth/login
 * Autentica un usuario con email y contraseña
 * Devuelve un JWT y la información del usuario si las credenciales son válidas
 * 
 * @param {Object} req.body.email - Email del usuario
 * @param {Object} req.body.password - Contraseña en texto plano
 * @returns {Object} Token JWT y datos del usuario autenticado
 */
export const login = async (req, res) => {
  // Extraer credenciales del cuerpo de la solicitud
  const { email, password } = req.body;

  // Validar que ambos campos estén presentes
  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });

  try {
    // Buscar usuario en la base de datos por email
    // La búsqueda es case-insensitive usando LOWER() para mejor UX
    // Esto aprovecha el índice creado en LOWER(email) para optimizar la consulta
    const result = await db.query(
      `SELECT id, name, last_name, email, phone, password, role, is_active, profile_image
       FROM "User"
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    // Verificar si se encontró el usuario
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Verificar que el usuario esté activo en el sistema
    // Los usuarios desactivados no pueden iniciar sesión
    if (!user.is_active) {
      return res.status(403).json({ message: 'Usuario desactivado, contacte al administrador' });
    }

    // Comparar la contraseña proporcionada con el hash almacenado
    // bcrypt se encarga de la comparación segura
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token JWT con la información del usuario
    // El token incluye: id y rol del usuario
    // Expira en 4 horas por seguridad
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'jwtsecret',  // Usar variable de entorno o fallback
      { expiresIn: '4h' }
    );

    // Responder con éxito: enviar token y datos del usuario
    // No se incluye la contraseña hasheada en la respuesta
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
        is_active: user.is_active,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    // Capturar cualquier error durante el proceso de autenticación
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en el sistema
 * Valida que el email no exista previamente y que las contraseñas coincidan
 * 
 * @param {Object} req.body.name - Nombre del usuario
 * @param {Object} req.body.last_name - Apellido del usuario
 * @param {Object} req.body.prefix - Prefijo telefónico (código de país)
 * @param {Object} req.body.phone - Número de teléfono sin prefijo
 * @param {Object} req.body.email - Email único del usuario
 * @param {Object} req.body.password - Contraseña en texto plano
 * @param {Object} req.body.confirmPassword - Confirmación de la contraseña
 * @param {Object} req.body.role - Rol del usuario (admin, maestro, padre)
 * @returns {Object} Datos del usuario registrado (sin contraseña)
 */
export const register = async (req, res) => {
  // Extraer todos los campos necesarios del cuerpo de la solicitud
  const { name, last_name, prefix, phone, email, password, confirmPassword, role } = req.body;

  // Validar que todos los campos obligatorios estén presentes
  if (!name || !last_name || !prefix || !phone || !email || !password || !confirmPassword || !role) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  // Validar que la contraseña y su confirmación coincidan
  // Esto previene errores de escritura del usuario
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  }

  try {
    // Verificar si el email ya está registrado en el sistema
    // La búsqueda es case-insensitive para evitar duplicados como user@email.com y USER@email.com
    const check = await db.query('SELECT id FROM "User" WHERE LOWER(email) = LOWER($1)', [email]);
    if (check.rowCount > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Generar hash seguro de la contraseña usando bcrypt
    // El segundo parámetro (10) es el número de salt rounds para el hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Concatenar el prefijo telefónico con el número de teléfono
    // Ejemplo: prefix="+502", phone="12345678" → fullPhone="+50212345678"
    const fullPhone = `${prefix}${phone}`;

    // Insertar el nuevo usuario en la base de datos
    // RETURNING devuelve los datos del usuario recién creado
    const insert = await db.query(
      `INSERT INTO "User"(name, last_name, phone, email, password, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, last_name, phone, email, role`,
      [name, last_name, fullPhone, email, hashedPassword, role]
    );

    const newUser = insert.rows[0];

    // Responder con código 201 (Created) y los datos del nuevo usuario
    // La contraseña hasheada no se incluye en la respuesta por seguridad
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser
    });
  } catch (error) {
    // Capturar y registrar cualquier error durante el registro
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

/**
 * PUT /api/auth/update-password
 * Actualiza la contraseña de un usuario existente
 * Requiere la contraseña actual para verificar la identidad del usuario
 * 
 * @param {Object} req.body.userId - ID del usuario que desea cambiar su contraseña
 * @param {Object} req.body.currentPassword - Contraseña actual del usuario
 * @param {Object} req.body.newPassword - Nueva contraseña deseada
 * @returns {Object} Mensaje de confirmación
 */
export const updatePassword = async (req, res) => {
  // Extraer los campos necesarios del cuerpo de la solicitud
  const { userId, currentPassword, newPassword } = req.body;

  // Validar que todos los campos requeridos estén presentes
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'userId, currentPassword y newPassword son obligatorios' });
  }

  try {
    // Consultar la contraseña hasheada actual del usuario
    const result = await db.query('SELECT password FROM "User" WHERE id = $1', [userId]);

    // Verificar que el usuario exista en la base de datos
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    
    // Verificar que la contraseña actual proporcionada sea correcta
    // Esto es una medida de seguridad para confirmar la identidad del usuario
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Generar hash de la nueva contraseña
    // Usar 10 salt rounds para un balance entre seguridad y rendimiento
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    await db.query(
      `UPDATE "User" SET password = $1 WHERE id = $2`,
      [hashedPassword, userId]
    );

    // Confirmar la actualización exitosa
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    // Capturar y registrar cualquier error durante el proceso
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/auth/refresh
 * Refresca un token JWT existente antes de que expire
 * Permite mantener la sesión del usuario activa sin requerir un nuevo login
 * Valida que el usuario siga activo en el sistema antes de emitir un nuevo token
 * 
 * @param {String} req.headers.authorization - Header con el token JWT actual (formato: "Bearer <token>")
 * @returns {Object} Nuevo token JWT y datos actualizados del usuario
 */
export const refresh = async (req, res) => {
  try {
    // Extraer el header de autorización
    const auth = req.headers.authorization || "";
    
    // Extraer el token del formato "Bearer <token>"
    const oldToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    
    // Validar que se proporcionó un token
    if (!oldToken) return res.status(401).json({ message: "No token provided" });

    // Verificar que el token sea válido y no haya expirado
    // jwt.verify lanza un error si el token es inválido o ha expirado
    let payload;
    try {
      payload = jwt.verify(oldToken, process.env.JWT_SECRET || 'jwtsecret');
    } catch (e) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    // Consultar la información actualizada del usuario desde la base de datos
    // Esto asegura que el usuario aún existe y sigue activo
    const result = await db.query(
      `SELECT id, name, last_name, email, phone, role, is_active, profile_image
         FROM "User"
        WHERE id = $1
        LIMIT 1`,
      [payload.id]
    );
    
    // Verificar que el usuario existe
    if (result.rowCount === 0) return res.status(404).json({ message: "Usuario no encontrado" });

    const u = result.rows[0];
    
    // Verificar que el usuario sigue activo en el sistema
    // Un usuario desactivado no puede refrescar su token
    if (!u.is_active) return res.status(403).json({ message: "Usuario desactivado" });

    // Generar un nuevo token JWT con la misma información pero con tiempo de expiración renovado
    // Esto extiende la sesión del usuario por 4 horas adicionales
    const newToken = jwt.sign(
      { id: u.id, role: u.role },
      process.env.JWT_SECRET || 'jwtsecret',
      { expiresIn: '4h' }
    );

    // Retornar el nuevo token y los datos actualizados del usuario
    return res.status(200).json({
      token: newToken,
      user: {
        id: u.id,
        name: u.name,
        last_name: u.last_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        is_active: u.is_active,
        profile_image: u.profile_image
      }
    });
  } catch (e) {
    // Capturar cualquier error inesperado durante el proceso
    console.error("Error en refresh:", e);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
