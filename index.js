import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './src/routes/index.js';

dotenv.config();

import './src/db/connection.js'; // solo para verificar conexión a la base de datos

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});