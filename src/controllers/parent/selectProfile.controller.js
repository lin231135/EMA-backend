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

/**
 * POST /api/parents/children
 * Crea un nuevo perfil de hijo asociado al padre autenticado
 */
export async function createChild(req, res) {
  try {
    // El ID del usuario y su rol ya están validados por verifyToken middleware
    const authUserId = req.user.id;

    // Extraer datos validados del body (ya validados por middleware Zod)
    const { name, birth_date, is_solvent = false } = req.body;

    // Verificar que el padre existe y está activo en la base de datos
    const parentCheck = await pool.query(
      `SELECT id FROM "User" WHERE id = $1 AND is_active = TRUE AND role = 'padre' LIMIT 1`,
      [authUserId]
    );
    
    if (parentCheck.rowCount === 0) {
      return res.status(404).json({ 
        error: "Not Found",
        message: "Parent user not found or inactive" 
      });
    }

    // Insertar el nuevo hijo en la base de datos
    const insertQuery = `
      INSERT INTO Kid (parent_id, name, birth_date, is_solvent, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, name, birth_date, is_solvent, is_active, created_at
    `;

    const result = await pool.query(insertQuery, [
      authUserId,
      name,
      birth_date,
      is_solvent
    ]);

    // Obtener el hijo recién creado
    const newKid = result.rows[0];

    // Retornar el perfil del hijo creado (201 Created)
    return res.status(201).json({
      message: "Child profile created successfully",
      child: {
        id: newKid.id,
        name: newKid.name,
        birthDate: newKid.birth_date,
        isSolvent: newKid.is_solvent,
        isActive: newKid.is_active,
        createdAt: newKid.created_at
      }
    });

  } catch (err) {
    // Registrar el error completo en consola para debugging
    console.error("createChild error:", err);
    
    // Errores de violación de constraint de base de datos (23xxx en PostgreSQL)
    if (err.code && err.code.startsWith('23')) {
      return res.status(409).json({ 
        error: "Conflict",
        message: "Database constraint violation",
        detail: err.detail || "The operation conflicts with existing data"
      });
    }
    
    // Error genérico del servidor (500 Internal Server Error)
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating the child profile" 
    });
  }
}

/**
 * DELETE /api/parents/children/:kidId
 * Elimina un perfil de hijo asociado al padre autenticado
 */
export async function deleteChild(req, res) {
  try {
    // El ID del usuario y su rol ya están validados por verifyToken middleware
    const authUserId = req.user.id;
    
    // Extraer el kidId validado de los parámetros (ya validado por middleware Zod)
    const { kidId } = req.params;

    // Verificar que el padre existe y está activo
    const parentCheck = await pool.query(
      `SELECT id FROM "User" WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [authUserId]
    );
    
    if (parentCheck.rowCount === 0) {
      return res.status(404).json({ 
        error: "Not Found",
        message: "Parent user not found or inactive" 
      });
    }

    // Verificar que el hijo existe y pertenece al padre autenticado
    const kidCheck = await pool.query(
      `SELECT id, name, parent_id FROM Kid WHERE id = $1 LIMIT 1`,
      [kidId]
    );
    
    // 404: El hijo no existe en la base de datos
    if (kidCheck.rowCount === 0) {
      return res.status(404).json({ 
        error: "Not Found",
        message: "Child not found" 
      });
    }

    const kid = kidCheck.rows[0];

    // 403: El hijo existe pero no pertenece al padre autenticado
    if (kid.parent_id !== authUserId) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: "You do not have permission to delete this child profile" 
      });
    }

    // Eliminar el hijo de la base de datos
    // El ON DELETE CASCADE en la FK se encargará de eliminar registros relacionados
    const deleteQuery = `
      DELETE FROM Kid
      WHERE id = $1
      RETURNING id, name
    `;

    const result = await pool.query(deleteQuery, [kidId]);

    // Si no se eliminó ningún registro (no debería ocurrir en este punto, pero por seguridad)
    if (result.rowCount === 0) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to delete child profile"
      });
    }

    const deletedKid = result.rows[0];

    // Retornar respuesta exitosa (200 OK con información del hijo eliminado)
    return res.status(200).json({
      message: "Child profile deleted successfully",
      deleted: {
        id: deletedKid.id,
        name: deletedKid.name
      }
    });

  } catch (err) {
    // Registrar el error completo en consola para debugging
    console.error("deleteChild error:", err);
    
    // Errores de violación de constraint de base de datos (23xxx en PostgreSQL)
    // Por ejemplo, si hay registros dependientes que no permiten la eliminación
    if (err.code && err.code.startsWith('23')) {
      return res.status(409).json({ 
        error: "Conflict",
        message: "Cannot delete child profile due to existing related data",
        detail: err.detail || "The child profile is referenced by other records"
      });
    }
    
    // Error genérico del servidor (500 Internal Server Error)
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: "An unexpected error occurred while deleting the child profile" 
    });
  }
}
