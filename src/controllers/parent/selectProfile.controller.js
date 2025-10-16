// src/controllers/parent/selectProfile.controller.js
import pool from "../../db/connection.js";

/**
 * GET /api/parents/children
 * Devuelve los hijos del padre autenticado (por JWT)
 * Tablas reales: "User" (padre), Kid (hijos)
 */
export async function getChildrenByParent(req, res) {
  try {
    // Extraer el ID del usuario autenticado desde el token JWT (agregado por middleware de autenticación)
    const authUserId = req.user?.id;
    
    // Verificar que el usuario esté autenticado
    if (!authUserId) return res.status(401).json({ message: "Unauthorized" });

    // Consultar la base de datos para validar que el usuario existe y está activo
    // Esto también nos permite verificar su rol
    const u = await pool.query(
      `SELECT id, role FROM "User" WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [authUserId]
    );
    
    // Verificar que el usuario existe en la base de datos
    if (u.rowCount === 0) return res.status(404).json({ message: "User not found" });
    
    // Validar que el usuario tenga el rol de 'padre' para acceder a esta funcionalidad
    if (u.rows[0].role !== "padre") {
      return res.status(403).json({ message: "Only parents can access children list" });
    }

    // Consultar todos los hijos asociados a este padre desde la tabla Kid
    // Los hijos se ordenan alfabéticamente por nombre
    const kidsQ = await pool.query(
      `SELECT id, name
         FROM Kid
        WHERE parent_id = $1
        ORDER BY name`,
      [authUserId]
    );

    // Transformar los datos al formato esperado por el frontend
    // Cada hijo se convierte en un objeto con estructura estandarizada
    const children = kidsQ.rows.map((k) => ({
      id: k.id,                // ID único del hijo
      name: k.name,            // Nombre del hijo
      avatarUrl: null,         // Avatar no disponible en el esquema actual de Kid
      type: "student",         // Tipo de perfil para distinguir en el frontend
    }));

    // Retornar la lista de hijos en formato JSON
    return res.json(children);
  } catch (err) {
    // Capturar cualquier error durante el proceso y registrarlo en consola
    console.error("getChildrenByParent:", err);
    // Retornar error 500 al cliente
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/parents/profiles
 * Devuelve { parent, children[] } para la pantalla de selección de perfiles.
 * Este endpoint se usa cuando un padre inicia sesión y necesita ver todos los perfiles
 * disponibles (el suyo y los de sus hijos) para seleccionar con cuál desea continuar.
 */
export async function getParentProfiles(req, res) {
  try {
    // Extraer el ID del usuario autenticado desde el token JWT
    const authUserId = req.user?.id;
    
    // Verificar que el usuario esté autenticado
    if (!authUserId) return res.status(401).json({ message: "Unauthorized" });

    // Consultar la información del padre desde la tabla User
    // Obtenemos id, nombre, apellido y rol para construir el perfil
    const parentQ = await pool.query(
      `SELECT id, name, last_name, role
         FROM "User"
        WHERE id = $1 AND is_active = TRUE
        LIMIT 1`,
      [authUserId]
    );

    // Si no se encuentra el usuario, retornar respuesta vacía
    // Esto puede ocurrir si el usuario fue desactivado o eliminado
    if (parentQ.rowCount === 0) {
      return res.json({ parent: null, children: [] });
    }
    
    const parentRow = parentQ.rows[0];
    
    // Validar que el usuario tenga el rol de 'padre'
    // Solo los padres pueden acceder a la pantalla de selección de perfiles
    if (parentRow.role !== "padre") {
      return res.status(403).json({ message: "Only parents can access profiles" });
    }

    // Construir el objeto de perfil del padre con la estructura esperada por el frontend
    const parent = {
      id: parentRow.id,                                              // ID único del padre
      name: `${parentRow.name} ${parentRow.last_name}`.trim(),      // Nombre completo concatenado
      avatarUrl: null,                                               // Avatar no disponible en esquema actual
      type: "parent",                                                // Tipo de perfil para distinguir en frontend
    };

    // Consultar todos los hijos asociados a este padre
    // Se ordenan alfabéticamente por nombre para mejor UX
    const kidsQ = await pool.query(
      `SELECT id, name
         FROM Kid
        WHERE parent_id = $1
        ORDER BY name`,
      [authUserId]
    );

    // Transformar cada hijo al formato esperado por el frontend
    // Mapeo de datos de base de datos a estructura de respuesta API
    const children = kidsQ.rows.map((k) => ({
      id: k.id,                // ID único del hijo
      name: k.name,            // Nombre del hijo
      avatarUrl: null,         // Avatar no disponible en esquema actual
      type: "student",         // Tipo de perfil (estudiante)
    }));

    // Retornar ambos perfiles: el del padre y la lista de sus hijos
    // Esto permite al frontend mostrar todas las opciones de perfil disponibles
    return res.json({ parent, children });
  } catch (err) {
    // Capturar y registrar cualquier error durante el proceso
    console.error("getParentProfiles:", err);
    // Retornar error genérico al cliente sin exponer detalles internos
    return res.status(500).json({ message: "Server error" });
  }
}
