import Message from '../models/Message.js';

// ─── State ────────────────────────────────────────────────────────────────────
const roomParticipants = new Map();
const getRoomUsers = (roomId) => Array.from(roomParticipants.get(roomId)?.values() || []);

const removeSocketFromRooms = (socketId) => {
  roomParticipants.forEach((participants, roomId) => {
    if (participants.delete(socketId) && participants.size === 0) {
      roomParticipants.delete(roomId);
    }
  });
};

// ─── Handler Factories (SRP) ──────────────────────────────────────────────────

function createUserHandlers(io, socket) {
  socket.on('setup_user', async (userId) => {
    if (!userId) return;
    socket.join(userId);

    try {
      const offlineMessages = await Message.find({ receiver: userId, status: 'sent' });
      if (offlineMessages.length > 0) {
        await Message.updateMany(
          { receiver: userId, status: 'sent' },
          { $set: { status: 'delivered' } },
        );

        const senders = new Set(offlineMessages.map((m) => m.sender.toString()));
        senders.forEach((senderId) => {
          io.to(senderId).emit('messages_delivered', { senderId, receiverId: userId });
        });
      }
    } catch (err) {
      console.error('Offline queuing delivery error:', err);
    }
  });

  socket.on('disconnect', () => {
    const affectedRooms = [];
    roomParticipants.forEach((participants, roomId) => {
      if (participants.has(socket.id)) affectedRooms.push(roomId);
    });

    removeSocketFromRooms(socket.id);
    affectedRooms.forEach((roomId) => {
      io.to(roomId).emit('user-list-update', getRoomUsers(roomId));
    });
  });
}

function createDirectMessageHandlers(io, socket) {
  socket.on('join_chat', (room) => socket.join(room));

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text, fileUrl, fileType, fileName, room } = data;
    try {
      const isOnline = io.sockets.adapter.rooms.has(receiverId.toString());
      const status = isOnline ? 'delivered' : 'sent';

      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text,
        fileUrl,
        fileType: fileType || 'none',
        fileName,
        status,
      });

      socket.to(room).emit('receive_message', newMessage);
      socket.emit('message_status_update', { messageId: newMessage._id, status: newMessage.status });
    } catch (err) {
      console.error('Direct message error:', err);
    }
  });

  socket.on('read_messages', async ({ senderId, receiverId }) => {
    try {
      await Message.updateMany(
        { sender: senderId, receiver: receiverId, status: { $ne: 'read' } },
        { $set: { status: 'read', readAt: new Date() } },
      );
      io.to(senderId.toString()).emit('messages_read', { senderId, receiverId });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  });
}

function createGroupHandlers(io, socket) {
  socket.on('join_group', (groupId) => socket.join(groupId));

  socket.on('send_group_message', async (data) => {
    const { senderId, groupId, text, fileUrl, fileType, fileName } = data;
    try {
      const newMessage = await Message.create({
        sender: senderId,
        group: groupId,
        text,
        fileUrl,
        fileType,
        fileName,
      });

      const populatedMsg = await newMessage.populate('sender', 'name profilePicture');
      io.to(groupId).emit('receive_group_message', populatedMsg);
    } catch (err) {
      console.error('Group message error:', err);
    }
  });
}

function createRoomHandlers(io, socket) {
  socket.on('join-room', ({ roomId, username }) => {
    if (!roomId || !username) return;

    socket.join(roomId);
    const participants = roomParticipants.get(roomId) || new Map();
    participants.set(socket.id, {
      id: socket.id,
      name: username,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    });
    roomParticipants.set(roomId, participants);
    io.to(roomId).emit('user-list-update', getRoomUsers(roomId));
  });

  socket.on('typing', ({ roomId, username }) => {
    if (roomId && username) {
      socket.to(roomId).emit('remote-typing', username);
    }
  });
}

/**
 * createHackathonHandlers — Hackathon team chat & live updates.
 *
 * Reuse strategy:
 *  - 'join_hackathon_team' mirrors 'join_group' — joins the team's Group room.
 *    This means the existing send_group_message / receive_group_message pipeline
 *    handles all team chat messages with ZERO new code.
 *  - 'hackathon_team_update' broadcasts real-time team roster changes.
 *
 * NO existing handlers are modified. This is a pure additive extension.
 */
function createHackathonHandlers(io, socket) {
  // Join a hackathon team's chat room (reuses group socket infrastructure)
  socket.on('join_hackathon_team', ({ teamId, userId }) => {
    if (!teamId || !userId) return;
    // We join using the teamId as the room — matching how GroupChatWindow.js uses groupId
    socket.join(teamId);
  });

  // Broadcast team member changes (join/leave/invite) to all team members
  socket.on('hackathon_team_update', ({ teamId, event, payload }) => {
    if (!teamId) return;
    socket.to(teamId).emit('hackathon_team_update', { event, payload });
  });

  // Live submission status broadcast within the team room
  socket.on('hackathon_submission_update', ({ teamId, isDraft }) => {
    if (!teamId) return;
    socket.to(teamId).emit('hackathon_submission_update', { isDraft });
  });
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

/**
 * registerSocketHandlers
 * Refactored using Factory Method to separate concerns (SRP).
 */
export const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    createUserHandlers(io, socket);
    createDirectMessageHandlers(io, socket);
    createGroupHandlers(io, socket);
    createRoomHandlers(io, socket);
    createHackathonHandlers(io, socket); // ← new, additive only
  });
};

