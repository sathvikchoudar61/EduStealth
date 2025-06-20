import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionName: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  date: { type: Date, required: true },
});

export default mongoose.model('Question', questionSchema); 