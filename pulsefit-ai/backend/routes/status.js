import { Status, BuddyRequest } from '../models/index.js';
import { upload } from '../utils/upload.js';
import { route, wrap } from './helpers.js';
const r = route();
r.post('/', upload.single('photo'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({
    error: 'Image required'
  });
  res.status(201).json(await Status.create({
    userId: req.user.id,
    imageUrl: '/uploads/' + req.file.filename,
    caption: String(req.body.caption || '').slice(0, 120),
    expiresAt: new Date(Date.now() + 86400000)
  }));
}));
r.get('/feed', wrap(async (req, res) => {
  const bs = await BuddyRequest.find({
    status: 'accepted',
    $or: [{
      from: req.user.id
    }, {
      to: req.user.id
    }]
  });
  const ids = [req.user.id, ...bs.map(b => String(b.from) === req.user.id ? b.to : b.from)];
  res.json(await Status.find({
    userId: {
      $in: ids
    },
    expiresAt: {
      $gt: new Date()
    }
  }).sort({
    createdAt: -1
  }));
}));
r.post('/:id/view', wrap(async (req, res) => {
  const s = await Status.findById(req.params.id);
  if (!s || s.expiresAt < new Date()) return res.sendStatus(404);
  if (String(s.userId) !== req.user.id && !(await BuddyRequest.exists({
    status: 'accepted',
    $or: [{
      from: req.user.id,
      to: s.userId
    }, {
      from: s.userId,
      to: req.user.id
    }]
  }))) return res.sendStatus(403);
  await Status.updateOne({
    _id: s.id
  }, {
    $addToSet: {
      views: req.user.id
    }
  });
  res.json({
    ok: true
  });
}));
r.delete('/:id', wrap(async (req, res) => {
  await Status.deleteOne({
    _id: req.params.id,
    userId: req.user.id
  });
  res.json({
    ok: true
  });
}));
export default r;
