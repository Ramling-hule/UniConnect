import express from 'express';
import http from 'http'; // Import HTTP module
import { Server } from 'socket.io'; // Import Socket.io
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../src/config/db.js';

// Import Routes...
import authRoutes from '../src/routes/authRoutes.js';
import dashboardRoutes from '../src/routes/dashboardRoutes.js';
import Message from '../src/models/Message.js'; // Import Message Model

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app); // Wrap Express

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // Allow Frontend
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  // 1. Join a specific room based on User ID
  socket.on('join_chat', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  // 2. Handle Sending Messages
  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text, room } = data;

    // Save to Database
    try {
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text
      });

      // Emit to the specific room (Real-time)
      socket.to(room).emit('receive_message', newMessage);
      
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});
// -----------------------

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fetch Chat History Route (Add this temporarily here or in controller)
app.get('/api/messages/:userId/:otherId', async (req, res) => {
    try {
        const { userId, otherId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherId },
                { sender: otherId, receiver: userId }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

const PORT = process.env.PORT || 5000;
// NOTICE: We listen on 'server', not 'app'
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));