import app from './src/server.js';

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});