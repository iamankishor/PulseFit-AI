import { Notification } from '../models/index.js';
import { route, wrap, paginate } from './helpers.js';
const r = route();
r.get('/', wrap(async (req, res) => {
  const filter = {
    userId: req.user.id
  };
  if (req.query.unreadOnly === 'true') filter.read = false;
  res.json({
    ...(await paginate(Notification, filter, req.query)),
    unreadCount: await Notification.countDocuments({
      userId: req.user.id,
      read: false
    })
  });
}));
r.post('/read-all', wrap(async (req, res) => {
  await Notification.updateMany({
    userId: req.user.id
  }, {
    $set: {
      read: true
    }
  });
  res.json({
    ok: true
  });
}));
r.post('/:id/read', wrap(async (req, res) => res.json(await Notification.findOneAndUpdate({
  _id: req.params.id,
  userId: req.user.id
}, {
  $set: {
    read: true
  }
}, {
  new: true
}))));
export default r;
