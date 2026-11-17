import jwt from 'jsonwebtoken';
import { User } from './models/index.js';
import { permitted, sendMessage } from './routes/chat.js';
export function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const p = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.user = await User.findById(p.id);
      if (!socket.user) throw Error('Unauthorized');
      next();
    } catch (e) {
      next(Error('Unauthorized'));
    }
  });
  const online = new Map();
  io.on('connection', socket => {
    const uid = String(socket.user.id);
    socket.join('user:' + uid);
    online.set(uid, (online.get(uid) || 0) + 1);
    io.emit('online', [...online.keys()]);
    socket.on('join-conversation', async ({
      conversationId
    } = {}) => {
      if (await permitted(conversationId, uid)) socket.join('conversation:' + conversationId);
    });
    socket.on('leave-conversation', ({
      conversationId
    } = {}) => socket.leave('conversation:' + conversationId));
    socket.on('typing', async ({
      conversationId,
      typing
    } = {}) => {
      if (await permitted(conversationId, uid)) socket.to('conversation:' + conversationId).emit('typing', {
        userId: uid,
        typing: !!typing
      });
    });
    socket.on('send-message', async ({
      conversationId,
      text
    } = {}, ack = () => {}) => {
      try {
        const c = await permitted(conversationId, uid);
        if (!c) return ack({
          error: 'Forbidden'
        });
        const out = await sendMessage(c, uid, text);
        io.to('conversation:' + conversationId).emit('message', {
          message: out.message
        });
        io.to('user:' + out.recipient).emit('notification', {
          notification: out.notification
        });
        ack({
          ok: true,
          message: out.message
        });
      } catch (e) {
        ack({
          error: e.message
        });
      }
    });
    socket.on('disconnect', () => {
      const n = (online.get(uid) || 1) - 1;
      if (n) online.set(uid, n);else online.delete(uid);
      io.emit('online', [...online.keys()]);
    });
  });
}
