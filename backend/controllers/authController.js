import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique EduStealth ID
    let eduId;
    let isUnique = false;
    while (!isUnique) {
      eduId = 'EDU-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const existing = await User.findOne({ eduId });
      if (!existing) isUnique = true;
    }

    const user = new User({ username, email, password: hashedPassword, eduId });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    // Check Decoy Password if main password fails
    if (!isMatch) {
      if (user.decoyPassword) {
        const isDecoyMatch = await bcrypt.compare(password, user.decoyPassword);
        if (isDecoyMatch) {
          const token = jwt.sign(
            { userId: user._id, isDecoy: true },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
          );
          // Return Decoy Flag
          return res.json({ token, isDecoy: true, user: { username: 'Student', eduId: 'N/A' } });
        }
      }
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, eduId: user.eduId } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getUsers = async (req, res) => {
  try {
    // EduStealth: No public list. Only return connected users or search by ID.
    // For now, return empty or implement basic search if query provided.
    const { search } = req.query;
    if (search) {
      // Strict search by EduID (case insensitive)
      const user = await User.findOne({ eduId: search.toUpperCase() }, 'username eduId _id profile');
      return res.json(user ? [user] : []);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    let avatarUrl = '';
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'edustealth/avatars',
        resource_type: 'image',
      });
      avatarUrl = result.secure_url;
    } else {
      avatarUrl = `/temp/${req.file.filename}`;
    }
    const user = await User.findByIdAndUpdate(
      req.body.userId,
      { 'profile.avatar': avatarUrl },
      { new: true }
    );
    res.json({ avatar: avatarUrl, user });
  } catch (err) {
    res.status(500).json({ message: 'Avatar upload failed.' });
  }
};

export const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    res.json({ message: 'Verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateDecoyPassword = async (req, res) => {
  try {
    const { decoyPassword } = req.body;
    const userId = req.user.userId;

    if (!decoyPassword) {
      return res.status(400).json({ message: 'Decoy password is required' });
    }

    const hashedPassword = await bcrypt.hash(decoyPassword, 10);
    await User.findByIdAndUpdate(userId, { decoyPassword: hashedPassword });

    res.json({ message: 'Decoy password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePublicKey = async (req, res) => {
  try {
    const { publicKey } = req.body;
    const userId = req.user.userId;
    await User.findByIdAndUpdate(userId, { publicKey });
    res.json({ message: 'Public Key updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};