import express from 'express';
import Question from '../models/Question.js';

const router = express.Router();

function toUTCDateString(dateStr) {
  // Always treat as UTC midnight
  return new Date(dateStr + 'T00:00:00.000Z');
}

// Add questions for a specific date (admin)
router.post('/', async (req, res) => {
  const { questions, date } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ message: 'Questions must be an array.' });
  }
  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }
  const targetDate = toUTCDateString(date);
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (targetDate > todayUTC) {
    return res.status(400).json({ message: 'Cannot add questions for a future date.' });
  }
  try {
    await Question.deleteMany({ date: targetDate });
    const docs = questions.map(q => ({ ...q, date: targetDate }));
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
  const targetDate = toUTCDateString(date);
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (targetDate >= todayUTC) {
    return res.status(400).json({ message: 'Can only update previous dates.' });
  }
  try {
    await Question.deleteMany({ date: targetDate });
    const docs = questions.map(q => ({ ...q, date: targetDate }));
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
  let queryDate = toUTCDateString(date);
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (queryDate > todayUTC) {
    return res.status(404).json({ message: 'Questions for future dates are not available.' });
  }
  try {
    const questions = await Question.find({ date: queryDate }).select('-__v');
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List all available dates (past and today only)
router.get('/dates', async (req, res) => {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  try {
    const dates = await Question.aggregate([
      { $match: { date: { $lte: todayUTC } } },
      { $group: { _id: '$date' } },
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
  const targetDate = toUTCDateString(date);
  try {
    await Question.deleteMany({ date: targetDate });
    res.status(200).json({ message: 'Questions deleted for this date.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List all previous questions (not today or future)
router.get('/all', async (req, res) => {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  try {
    const questions = await Question.find({ date: { $lt: todayUTC } }).sort({ date: -1 }).select('-__v');
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router; 