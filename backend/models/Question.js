import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionName: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  dateString: { type: String, required: true }, // format: 'YYYY-MM-DD'
});

export default mongoose.model('Question', questionSchema); 