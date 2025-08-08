import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { updateUser, setActive } from '../controllers/user.controller.js';

const router = Router();

router.patch('/:id', verifyToken, updateUser);
router.patch('/:id/activate', verifyToken, setActive(true));
router.patch('/:id/deactivate', verifyToken, setActive(false));

export default router;
