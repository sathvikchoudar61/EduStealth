import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }, // Encrypted
  type: { type: String, enum: ['text', 'image'], default: 'text' },
  imageUrl: { type: String },
  readAt: { type: Date },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);
export default Message; 