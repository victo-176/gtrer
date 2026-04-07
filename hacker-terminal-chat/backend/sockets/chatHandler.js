const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Report = require('../models/Report');

const connectedUsers = new Map();

function setupSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || user.isBlocked) return next(new Error('Invalid user'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    connectedUsers.set(userId, socket.id);

    User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec();

    io.emit('user_status', {
      userId,
      username: socket.user.username,
      status: 'online'
    });

    // Send recent messages
    Message.find({ type: 'global', deleted: false })
      .sort('-timestamp')
      .limit(50)
      .populate('sender', 'username avatar rank')
      .then(messages => {
        socket.emit('recent_messages', messages.reverse());
      });

    // Handle global message
    socket.on('global_message', async (content) => {
      if (!content?.trim() || socket.user.isSuspended) return;

      if (content.startsWith('/dm ')) {
        const parts = content.slice(4).split(' ');
        const targetUsername = parts[0];
        const dmContent = parts.slice(1).join(' ');
        if (targetUsername && dmContent) {
          const target = await User.findOne({ username: targetUsername });
          if (target) {
            const message = await Message.create({
              sender: socket.user._id,
              recipient: target._id,
              content: dmContent,
              type: 'dm'
            });
            const populated = await message.populate('sender', 'username avatar rank');
            const targetSocketId = connectedUsers.get(target._id.toString());
            if (targetSocketId) {
              io.to(targetSocketId).emit('dm_message', populated);
            }
            socket.emit('dm_message', populated);
          }
        }
        return;
      }

      const message = await Message.create({
        sender: socket.user._id,
        content: content.trim(),
        type: 'global'
      });
      const populated = await message.populate('sender', 'username avatar rank');
      io.emit('global_message', populated);
    });

    // Typing indicator
    socket.on('typing', (isTyping) => {
      socket.broadcast.emit('user_typing', {
        userId,
        username: socket.user.username,
        isTyping
      });
    });

    // Report user
    socket.on('report_user', async ({ reportedUserId, reason }) => {
      if (!reportedUserId) return;
      try {
        await Report.create({
          reporter: socket.user._id,
          reportedUser: reportedUserId,
          reason
        });
        socket.emit('system_message', { content: 'Report submitted successfully.' });
      } catch (err) {
        // Ignore duplicate report
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      io.emit('user_status', {
        userId,
        username: socket.user.username,
        status: 'offline'
      });
    });
  });
}

module.exports = { setupSocket };