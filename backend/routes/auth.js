import express from 'express';
import { register, login, getUsers } from '../controllers/authController.js';
import { upload } from '../controllers/chatController.js';
import { uploadAvatar } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', getUsers);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

export default router; 