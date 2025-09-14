// src/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', router);

// Inicializar el servicio de notificaciones de forma asíncrona y opcional
(async () => {
  try {
    const { default: notificationService } = await import('./services/notification.service.js');
    await notificationService.init();
    console.log('✅ Servicio de notificaciones inicializado correctamente');
  } catch (error) {
    console.warn('⚠️ No se pudo inicializar el servicio de notificaciones:', error.message);
    console.log('📝 El servidor continuará funcionando sin notificaciones automáticas');
  }
})();

export default app;