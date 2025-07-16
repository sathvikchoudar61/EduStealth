import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/connectDB.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Message from './models/Message.js';
import { encryptMessage, decryptMessage } from './controllers/chatController.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// MongoDB connection
connectDB().then(() => {
  console.log('MongoDB connection established');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

app.use('/temp', express.static('temp'));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('EduStealth backend running');
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join user-specific room
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      console.log('Received send_message:', data);
      // FIX: Do NOT re-encrypt, just store as-is
      const message = new Message({
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content, // already encrypted by frontend
        type: data.type || 'text',
        imageUrl: data.imageUrl || '',
      });
      await message.save();
      console.log('Message saved:', message);
      // Notify receiver
      io.to(data.receiverId).emit('receive_message', {
        ...data,
        _id: message._id,
        content: data.content,
        createdAt: message.createdAt,
      });
      // Notify sender
      io.to(data.senderId).emit('receive_message', {
        ...data,
        _id: message._id,
        content: data.content,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('Error in send_message:', err);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  // Read message
  socket.on('read_message', async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message && !message.readAt) {
        message.readAt = new Date();
        message.expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 min from read
        await message.save();
        // Notify sender (read)
        io.to(message.senderId.toString()).emit('read', { messageId });
        // Notify receiver (self-destruct countdown)
        io.to(userId).emit('self_destruct', { messageId, expiresAt: message.expiresAt });
      }
    } catch (err) {
      socket.emit('error', { message: 'Failed to mark as read.' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    // data: { senderId, receiverId }
    io.to(data.receiverId).emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Helper to emit message_deleted event
export function emitMessageDeleted(io, message) {
  io.to(message.senderId.toString()).emit('message_deleted', { messageId: message._id });
  io.to(message.receiverId.toString()).emit('message_deleted', { messageId: message._id });
}

app.set('io', io);

// Periodic job to delete expired messages
setInterval(async () => {
  try {
    const now = new Date();
    const expiredMessages = await Message.find({ expiresAt: { $lte: now } });
    for (const message of expiredMessages) {
      await message.deleteOne();
      emitMessageDeleted(io, message);
    }
  } catch (err) {
    console.error('Error deleting expired messages:', err);
  }
}, 30 * 1000); // every 30 seconds

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io };
