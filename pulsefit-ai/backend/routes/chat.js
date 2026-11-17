import { Conversation, Message, BuddyRequest, Notification } from '../models/index.js';
import { route, wrap } from './helpers.js';
export async function canChat(a, b) {
  return !!(await BuddyRequest.exists({
    status: 'accepted',
    $or: [{
      from: a,
      to: b
    }, {
      from: b,
      to: a
    }]
  }));
}
export async function permitted(id, user) {
  const c = await Conversation.findById(id);
  return c && c.participants.some(p => String(p) === String(user)) && (await canChat(...c.participants.map(String))) ? c : null;
}
export async function sendMessage(c, user, text) {
  if (!text?.trim() || text.length > 1000) throw Error('Invalid message');
  const m = await Message.create({
    conversationId: c.id,
    senderId: user,
    text: text.trim()
  });
  const recipient = c.participants.find(p => String(p) !== String(user));
  const notification = await Notification.create({
    userId: recipient,
    type: 'message',
    title: 'New message',
    body: text.slice(0, 80),
    link: '/chat/' + c.id
  });
  return {
    message: m,
    notification,
    recipient: String(recipient)
  };
}
const r = route();
r.post('/conversations', wrap(async (req, res) => {
  const other = req.body.userId;
  if (!(await canChat(req.user.id, other))) return res.sendStatus(403);
  let c = await Conversation.findOne({
    participants: {
      $all: [req.user.id, other],
      $size: 2
    }
  });
  if (!c) c = await Conversation.create({
    participants: [req.user.id, other]
  });
  res.json(c);
}));
r.get('/conversations', wrap(async (req, res) => res.json(await Conversation.find({
  participants: req.user.id
}).populate('participants', 'name avatarUrl').sort({
  updatedAt: -1
}))));
r.get('/conversations/:id/messages', wrap(async (req, res) => {
  const c = await permitted(req.params.id, req.user.id);
  if (!c) return res.sendStatus(403);
  res.json(await Message.find({
    conversationId: c.id
  }).sort({
    createdAt: 1
  }).limit(100));
}));
r.post('/conversations/:id/messages', wrap(async (req, res) => {
  const c = await permitted(req.params.id, req.user.id);
  if (!c) return res.sendStatus(403);
  const out = await sendMessage(c, req.user.id, req.body.text);
  req.app.get('io').to('conversation:' + c.id).emit('message', {
    message: out.message
  });
  req.app.get('io').to('user:' + out.recipient).emit('notification', {
    notification: out.notification
  });
  res.status(201).json(out.message);
}));
export default r;
