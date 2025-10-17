import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  // Opcionales útiles
  max: 10,
  idleTimeoutMillis: 30000,
  statement_timeout: 30000,
  application_name: 'ema-backend'
});

// Verifica conexión con reintento
const connectWithRetry = async (retries = 5, interval = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT NOW()');
      console.log('Conectado a PostgreSQL');
      return;
    } catch (err) {
      console.log(`Reintentando conexión ${i + 1}/${retries}...`, err?.message || err);
      await new Promise(res => setTimeout(res, interval));
    }
  }
  console.error('No se pudo conectar a PostgreSQL después de varios intentos');
};

connectWithRetry();

export default pool;