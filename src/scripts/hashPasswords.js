import db from '../db/connection.js';
import bcrypt from 'bcryptjs';

const actualizarPasswords = async () => {
  try {
    const result = await db.query('SELECT id, password FROM Users');

    for (const user of result.rows) {
      const { id, password } = user;

      if (password.length === 60 && password.startsWith('$2')) {
        console.log(`Usuario ${id} ya tiene contraseña hasheada`);
        continue;
      }

      const hashed = await bcrypt.hash(password, 10);
      await db.query('UPDATE Users SET password = $1 WHERE id = $2', [hashed, id]);
      console.log(`✅ Usuario ${id} actualizado`);
    }

    console.log('✅ Todas las contraseñas fueron actualizadas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar contraseñas:', error);
    process.exit(1);
  }
};

actualizarPasswords();