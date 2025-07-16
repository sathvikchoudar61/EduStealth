import Message from '../models/Message.js';
import jwt from 'jsonwebtoken';
import aesjs from 'aes-js';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { emitMessageDeleted } from '../server.js';

const getAesKey = () => {
  const key = process.env.CHAT_AES_SECRET || 'defaultkeydefaultkeydefaultkey12';
  // AES-256 requires 32 bytes key
  return aesjs.utils.utf8.toBytes(key.padEnd(32, '0').slice(0, 32));
};

export function encryptMessage(plainText) {
  const key = getAesKey();
  const textBytes = new TextEncoder().encode(plainText);
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  const encryptedBytes = aesCtr.encrypt(textBytes);
  return Buffer.from(encryptedBytes).toString('base64');
}

export function decryptMessage(encryptedBase64) {
  const key = getAesKey();
  const encryptedBytes = Buffer.from(encryptedBase64, 'base64');
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);
  return new TextDecoder().decode(decryptedBytes);
}

// Multer setup for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'temp/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
export const upload = multer({ storage });

// Cloudinary config (if provided)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (req, res) => {
  try {
    let imageUrl = '';
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'edustealth',
        resource_type: 'image',
      });
      imageUrl = result.secure_url;
    } else {
      // Local upload
      imageUrl = `/temp/${req.file.filename}`;
    }
    // REMOVE: Redis TTL for auto-delete
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ message: 'Image upload failed.' });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { withUserId } = req.query;
    if (!withUserId) return res.status(400).json({ message: 'withUserId is required.' });
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: withUserId },
        { senderId: withUserId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message.' });
    }
    if (message.readAt || (message.expiresAt && message.expiresAt < new Date())) {
      return res.status(400).json({ message: 'Cannot delete message after it is read or self-destructed.' });
    }
    await message.deleteOne();
    // Emit Socket.IO event
    emitMessageDeleted(req.app.get('io'), message);
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
}; 