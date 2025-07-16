import express from 'express';
import { getChatHistory, upload, uploadImage, deleteMessage } from '../controllers/chatController.js';

const router = express.Router();

router.get('/history', getChatHistory);
router.post('/upload', upload.single('image'), uploadImage);
router.delete('/message/:id', deleteMessage);

export default router; 