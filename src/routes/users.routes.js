import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { 
  updateUser, 
  setActive, 
  getUsers, 
  getProfileInfo, 
  updateProfileInfo, 
  updateAddressById,
  uploadProfileImage,      
  deleteProfileImage       
} from '../controllers/users.controller.js';

const router = Router();

// Listar usuarios (con filtro opcional por rol)
router.get('/', getUsers); // /api/users?role=padre

router.patch('/:id', verifyToken, updateUser);
router.patch('/:id/activate', verifyToken, setActive(true));
router.patch('/:id/deactivate', verifyToken, setActive(false));

/* Endpoints de profile */
router.get('/profile', verifyToken, getProfileInfo); // usa req.user.id, no param
router.put('/profile', verifyToken, updateProfileInfo);
router.put('/profile/address/:id', verifyToken, updateAddressById);

/* Endpoints de profile image */
router.post('/profile/image', verifyToken, uploadProfileImage);   // Subir/actualizar imagen
router.delete('/profile/image', verifyToken, deleteProfileImage); // Eliminar imagen

export default router;