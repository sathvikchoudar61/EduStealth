import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  eduId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    avatar: { type: String },
    bio: { type: String },
  },
  connections: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    muted: { type: Boolean, default: false },
    initiator: { type: Boolean },
    messageTimer: { type: Number, default: 180 }, // in seconds. Default 3 mins
    connectedAt: { type: Date, default: Date.now }
  }],
  decoyPassword: { type: String }, // Hashed decoy password
  publicKey: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
export default User; 