const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const onlineUsers = new Map();

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    socket.join(`user:${userId}`);
    io.emit('user:online', { userId, isOnline: true });

    const conversations = await Conversation.find({ participants: userId });
    conversations.forEach((c) => socket.join(c._id.toString()));

    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('message:send', async (payload, callback) => {
      try {
        const {
          conversationId,
          content,
          encrypted,
          messageType,
          fileUrl,
          fileName,
          fileSize,
        } = payload;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation?.participants.some((p) => p.equals(socket.user._id))) {
          return callback?.({ error: 'Access denied' });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          content: content || '',
          encrypted: Boolean(encrypted),
          messageType: messageType || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          fileSize: fileSize || 0,
          readBy: [{ user: socket.user._id }],
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populated = await Message.findById(message._id)
          .populate('sender', 'username avatar')
          .populate('readBy.user', 'username');

        io.to(conversationId).emit('message:new', populated);
        callback?.({ message: populated });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:start', {
        conversationId,
        userId,
        username: socket.user.username,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', {
        conversationId,
        userId,
      });
    });

    socket.on('message:read', async ({ messageId, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const alreadyRead = message.readBy.some((r) => r.user.equals(socket.user._id));
        if (!alreadyRead) {
          message.readBy.push({ user: socket.user._id });
          await message.save();
        }

        const populated = await Message.findById(message._id)
          .populate('sender', 'username avatar')
          .populate('readBy.user', 'username');

        io.to(conversationId).emit('message:read', {
          message: populated,
          readByUserId: userId,
        });
      } catch {
        /* ignore */
      }
    });

    socket.on('messages:read-all', async ({ conversationId }) => {
      try {
        const unread = await Message.find({
          conversation: conversationId,
          sender: { $ne: socket.user._id },
          'readBy.user': { $ne: socket.user._id },
        });

        const now = new Date();
        for (const msg of unread) {
          msg.readBy.push({ user: socket.user._id, readAt: now });
          await msg.save();
        }

        io.to(conversationId).emit('messages:read-all', {
          conversationId,
          readByUserId: userId,
        });
      } catch {
        /* ignore */
      }
    });

    socket.on('call:offer', ({ toUserId, offer, conversationId, callType }) => {
      io.to(`user:${toUserId}`).emit('call:offer', {
        fromUserId: userId,
        fromUsername: socket.user.username,
        offer,
        conversationId,
        callType,
      });
    });

    socket.on('call:answer', ({ toUserId, answer }) => {
      io.to(`user:${toUserId}`).emit('call:answer', {
        fromUserId: userId,
        answer,
      });
    });

    socket.on('call:ice-candidate', ({ toUserId, candidate }) => {
      io.to(`user:${toUserId}`).emit('call:ice-candidate', {
        fromUserId: userId,
        candidate,
      });
    });

    socket.on('call:end', ({ toUserId }) => {
      io.to(`user:${toUserId}`).emit('call:end', { fromUserId: userId });
    });

    socket.on('call:reject', ({ toUserId }) => {
      io.to(`user:${toUserId}`).emit('call:reject', { fromUserId: userId });
    });

    socket.on('disconnect', async () => {
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit('user:online', { userId, isOnline: false });
      }
    });
  });
};

module.exports = setupSocket;
