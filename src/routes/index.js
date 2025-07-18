import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente con Bun 🚀' });
});

export default router;