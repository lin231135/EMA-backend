// src/controllers/teacher/material.controller.js

import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { pool } from '../db/index.js';

// ================= CONFIGURACIÓN DE CLOUDINARY =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ================= FUNCIÓN AUXILIAR =================
// Sube un archivo a Cloudinary y devuelve su información
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'materials' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// ================= CREATE MATERIAL =================
export const createMaterial = async (req, res) => {
  try {
    const { teacher_course_id, title, description } = req.body;
    const file = req.file; // viene desde multer

    if (!teacher_course_id || !title || !file) {
      return res.status(400).json({ error: 'teacher_course_id, title y archivo son obligatorios.' });
    }

    // Subir a Cloudinary
    const result = await uploadToCloudinary(file.buffer);

    // Guardar en DB
    const query = `
      INSERT INTO Material (teacher_course_id, title, description, file_url, public_id, file_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      teacher_course_id,
      title,
      description || null,
      result.secure_url,
      result.public_id,
      result.resource_type
    ];

    const dbResult = await pool.query(query, values);
    res.status(201).json(dbResult.rows[0]);
  } catch (error) {
    console.error('Error al crear material:', error);
    res.status(500).json({ error: 'Error al crear material.' });
  }
};


// ================= GET ALL MATERIALS =================
export const getAllMaterials = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Material ORDER BY uploaded_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener materiales:', error);
    res.status(500).json({ error: 'Error al obtener materiales.' });
  }
};

// ================= GET MATERIAL BY ID =================
export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM Material WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener material:', error);
    res.status(500).json({ error: 'Error al obtener material.' });
  }
};

// ================= UPDATE MATERIAL =================
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const file = req.file; // puede venir o no

    // Obtener material existente
    const existing = await pool.query('SELECT * FROM Material WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Material no encontrado.' });
    }

    let file_url = existing.rows[0].file_url;
    let public_id = existing.rows[0].public_id;
    let file_type = existing.rows[0].file_type;

    // Si se subió un nuevo archivo, eliminar el anterior y subir el nuevo
    if (file) {
      await cloudinary.uploader.destroy(public_id, { resource_type: file_type });

      const result = await uploadToCloudinary(file.buffer);
      file_url = result.secure_url;
      public_id = result.public_id;
      file_type = result.resource_type;
    }

    // Actualizar en DB
    const query = `
      UPDATE Material
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          file_url = $3,
          public_id = $4,
          file_type = $5
      WHERE id = $6
      RETURNING *;
    `;
    const values = [title, description, file_url, public_id, file_type, id];
    const updated = await pool.query(query, values);

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error al actualizar material:', error);
    res.status(500).json({ error: 'Error al actualizar material.' });
  }
};
