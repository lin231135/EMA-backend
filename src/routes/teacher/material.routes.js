import express from 'express';
import multer from 'multer';
import {
  createMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial
} from '../../controllers/teacher/material.controller.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Crear material (subir archivo)
router.post('/', upload.single('file'), createMaterial);

// Obtener todos los materiales
router.get('/', getAllMaterials);

// Obtener un material por ID
router.get('/:id', getMaterialById);

// Actualizar material (puede incluir un nuevo archivo)
router.put('/:id', upload.single('file'), updateMaterial);

// Eliminar material
router.delete('/:id', deleteMaterial);

export default router;
