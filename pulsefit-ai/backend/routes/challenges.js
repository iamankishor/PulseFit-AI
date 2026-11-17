import { Challenge, CheckIn, Notification } from '../models/index.js';
import { route, wrap, day } from './helpers.js';
const r = route();
r.post('/', wrap(async (req, res) => {
  const c = await Challenge.create({
    ...req.body,
    createdBy: req.user.id,
    participants: [req.user.id]
  });
  res.status(201).json(c);
}));
r.get('/', wrap(async (req, res) => res.json(await Challenge.find().sort({
  createdAt: -1
}))));
r.get('/:id', wrap(async (req, res) => res.json(await Challenge.findById(req.params.id))));
r.post('/:id/join', wrap(async (req, res) => {
  const c = await Challenge.findById(req.params.id);
  if (!c) return res.sendStatus(404);
  if (!c.participants.some(x => String(x) === req.user.id)) {
    c.participants.push(req.user.id);
    await c.save();
    if (String(c.createdBy) !== req.user.id) await Notification.create({
      userId: c.createdBy,
      type: 'challenge_joined',
      title: 'New participant',
      body: req.user.name + ' joined ' + c.name,
      link: '/challenges'
    });
  }
  res.json(c);
}));
r.post('/:id/checkin', wrap(async (req, res) => {
  const c = await Challenge.findById(req.params.id);
  if (!c || !c.participants.some(x => String(x) === req.user.id)) return res.status(403).json({
    error: 'Join first'
  });
  res.json(await CheckIn.findOneAndUpdate({
    userId: req.user.id,
    challengeId: c.id,
    date: day()
  }, {
    $setOnInsert: {
      note: req.body.note || ''
    }
  }, {
    upsert: true,
    new: true
  }));
}));
r.get('/:id/leaderboard', wrap(async (req, res) => {
  const checks = await CheckIn.aggregate([{
    $match: {
      challengeId: new (await import('mongoose')).default.Types.ObjectId(req.params.id)
    }
  }, {
    $group: {
      _id: '$userId',
      count: {
        $sum: 1
      }
    }
  }, {
    $sort: {
      count: -1
    }
  }]);
  res.json(checks);
}));
export default r;
