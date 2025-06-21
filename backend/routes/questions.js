import express from 'express';
import Question from '../models/Question.js';

const router = express.Router();

// Helper to get local date string in YYYY-MM-DD format
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Add questions for a specific date (admin)
router.post('/', async (req, res) => {
  const { questions, date } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ message: 'Questions must be an array.' });
  }
  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }
  // Only allow today or past dates (local date string)
  const todayStr = getLocalDateString();
  if (date > todayStr) {
    return res.status(400).json({ message: 'Cannot add questions for a future date.' });
  }
  try {
    await Question.deleteMany({ dateString: date });
    const docs = questions.map(q => ({ ...q, dateString: date }));
    if (docs.length > 0) await Question.insertMany(docs);
    res.status(201).json({ message: 'Questions added for the date.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update questions for a specific past date
router.patch('/', async (req, res) => {
  const { questions, date } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ message: 'Questions must be an array.' });
  }
  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }
  const todayStr = getLocalDateString();
  if (date >= todayStr) {
    return res.status(400).json({ message: 'Can only update previous dates.' });
  }
  try {
    await Question.deleteMany({ dateString: date });
    const docs = questions.map(q => ({ ...q, dateString: date }));
    if (docs.length > 0) await Question.insertMany(docs);
    res.status(200).json({ message: 'Questions updated for the date.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get questions for a specific date (hide future questions)
router.get('/', async (req, res) => {
  let { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }
  const todayStr = getLocalDateString();
  if (date > todayStr) {
    return res.status(404).json({ message: 'Questions for future dates are not available.' });
  }
  try {
    const questions = await Question.find({ dateString: date }).select('-__v');
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List all available dates (past and today only)
router.get('/dates', async (req, res) => {
  const todayStr = getLocalDateString();
  try {
    const dates = await Question.aggregate([
      { $match: { dateString: { $lte: todayStr } } },
      { $group: { _id: '$dateString' } },
      { $sort: { _id: -1 } },
    ]);
    res.json(dates.map(d => d._id));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete all questions for a specific date
router.delete('/', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }
  try {
    await Question.deleteMany({ dateString: date });
    res.status(200).json({ message: 'Questions deleted for this date.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List all previous questions (not today or future)
router.get('/all', async (req, res) => {
  const todayStr = getLocalDateString();
  try {
    const questions = await Question.find({ dateString: { $lt: todayStr } }).sort({ dateString: -1 }).select('-__v');
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router; 