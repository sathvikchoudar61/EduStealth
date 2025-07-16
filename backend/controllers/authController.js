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
    const user = new User({ username, email, password: hashedPassword });
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
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username email _id');
    res.json(users.map(u => ({ id: u._id, username: u.username, email: u.email })));
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