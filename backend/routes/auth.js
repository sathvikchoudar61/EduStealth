import express from 'express';
import { register, login, getMe, getUsers, verifyPassword, updateDecoyPassword, updatePublicKey } from '../controllers/authController.js';
import { upload } from '../controllers/chatController.js';
import { uploadAvatar } from '../controllers/authController.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied.' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // Only allow changing decoy if NOT currently logged in as decoy
        if (verified.isDecoy) return res.status(403).json({ message: 'Restricted access.' });
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.get('/users', getUsers);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.post('/verify-password', verifyToken, verifyPassword);
router.post('/decoy-password', verifyToken, updateDecoyPassword);
router.post('/public-key', verifyToken, updatePublicKey);

export default router;