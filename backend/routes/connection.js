import express from 'express';
import { sendRequest, acceptRequest, getConnections, removeConnection, toggleMute, updateTimer } from '../controllers/connectionController.js';

const router = express.Router();

// Middleware to check auth (assuming you have one, or we use the logic from auth route)
// For now, I'll assume we need to import a middleware or just check req.user if it's set by server.js (server.js didn't seem to have global auth middleware for all routes, usually it's per route).
// Let's check how auth.js handles it. If it doesn't have middleware export, I might need to make one.
// user ID usually comes from verifying token. chatController does it manually.
// I will implement a simple middleware here or reuse one if found.

import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied.' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

router.post('/request', verifyToken, sendRequest);
router.post('/accept', verifyToken, acceptRequest);
router.post('/remove', verifyToken, removeConnection); // Using POST to share body easily, or DELETE with body
router.post('/mute', verifyToken, toggleMute);
router.post('/timer', verifyToken, updateTimer);
router.get('/', verifyToken, getConnections);

export default router;
