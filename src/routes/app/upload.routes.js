import express from 'express';
import multer from 'multer';
import { uploadPaymentProof } from '../../controllers/app/upload.controller.js';

const router = express.Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    // Permitir imágenes y PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG) y PDFs'));
    }
  }
});

router.post('/payment-proof', upload.single('image'), uploadPaymentProof);

export default router;