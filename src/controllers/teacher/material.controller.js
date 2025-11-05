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
