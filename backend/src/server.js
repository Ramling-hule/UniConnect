import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../src/config/db.js';

// --- REDIS IMPORTS (Keep existing auth/session logic) ---
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import redisClient from '../src/config/redis.js';

// --- ROUTE IMPORTS ---
import authRoutes from '../src/routes/authRoutes.js';
import dashboardRoutes from '../src/routes/dashboardRoutes.js';
import groupRoutes from '../src/routes/groupRoutes.js'; // <--- 1. NEW IMPORT

// --- MODEL IMPORTS ---
import Message from '../src/models/Message.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// --- SESSION MIDDLEWARE (Existing) ---
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  
  // --- EXISTING DM EVENTS ---
  socket.on('join_chat', (room) => {
    socket.join(room);
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text, room } = data;
    try {
      const newMessage = await Message.create({ sender: senderId, receiver: receiverId, text });
      socket.to(room).emit('receive_message', newMessage);
    } catch (err) {
      console.error(err);
    }
  });

  // --- 2. NEW GROUP CHAT EVENTS ---
  
  // Join Group Room
  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined Group ${groupId}`);
  });

  // Handle Group Messages
  socket.on('send_group_message', async (data) => {
    const { senderId, groupId, text, fileUrl, fileType, fileName } = data;

    try {
       // Save to DB
       const newMessage = await Message.create({
          sender: senderId,
          group: groupId, // Link to Group
          text,
          fileUrl,
          fileType,
          fileName
       });
       
       // Populate Sender Info
       const populatedMsg = await newMessage.populate('sender', 'name profilePicture');

       // Emit to everyone in the Group Room
       io.to(groupId).emit('receive_group_message', populatedMsg);
       
    } catch (err) {
       console.error("Group msg error:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

// --- MIDDLEWARE ---
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }));
app.use(express.json());

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/groups', groupRoutes); // <--- 3. NEW ROUTE REGISTRATION

// --- DM HISTORY ROUTE (Keep your existing one) ---
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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));