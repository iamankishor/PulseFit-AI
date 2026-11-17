import { BuddyRequest, Notification } from '../models/index.js';
import { route, wrap } from './helpers.js';
const r = route();
r.post('/', wrap(async (req, res) => {
  if (req.body.to === req.user.id) return res.status(400).json({
    error: 'Cannot request self'
  });
  let b = await BuddyRequest.findOne({
    from: req.user.id,
    to: req.body.to
  });
  if (b) return res.status(409).json({
    error: 'Request exists'
  });
  b = await BuddyRequest.create({
    from: req.user.id,
    to: req.body.to
  });
  await Notification.create({
    userId: b.to,
    type: 'buddy_request',
    title: 'Buddy request',
    body: req.user.name + ' wants to connect',
    link: '/buddies'
  });
  res.status(201).json(b);
}));
r.get('/incoming', wrap(async (req, res) => res.json(await BuddyRequest.find({
  to: req.user.id
}).populate('from', 'name avatarUrl'))));
r.get('/outgoing', wrap(async (req, res) => res.json(await BuddyRequest.find({
  from: req.user.id
}).populate('to', 'name avatarUrl'))));
r.get('/buddies', wrap(async (req, res) => res.json(await BuddyRequest.find({
  status: 'accepted',
  $or: [{
    from: req.user.id
  }, {
    to: req.user.id
  }]
}).populate('from to', 'name email avatarUrl'))));
for (const action of ['accept', 'reject']) r.post('/:id/' + action, wrap(async (req, res) => {
  const b = await BuddyRequest.findOne({
    _id: req.params.id,
    to: req.user.id,
    status: 'pending'
  });
  if (!b) return res.sendStatus(404);
  b.status = action === 'accept' ? 'accepted' : 'rejected';
  await b.save();
  if (action === 'accept') await Notification.create({
    userId: b.from,
    type: 'buddy_accepted',
    title: 'Request accepted',
    body: req.user.name + ' accepted your request',
    link: '/chat'
  });
  res.json(b);
}));
export default r;
