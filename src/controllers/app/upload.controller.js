import imagekit from '../../config/imagekit.js';

export const uploadPaymentProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    // Subir a ImageKit
    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'), // Archivo en base64
      fileName: `payment_${Date.now()}_${req.file.originalname}`,
      folder: '/payment-proofs/', // Carpeta en ImageKit
    });

    // Retornar la URL de la imagen
    res.status(200).json({
      success: true,
      data: {
        url: result.url,
        fileId: result.fileId,
        thumbnail: result.thumbnailUrl
      }
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al subir la imagen' 
    });
  }
};