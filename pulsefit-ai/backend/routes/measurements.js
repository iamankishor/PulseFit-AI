import { Measurement } from '../models/index.js';
import { route, wrap } from './helpers.js';
const r = route();
r.post('/', wrap(async (req, res) => res.status(201).json(await Measurement.create({
  ...req.body,
  userId: req.user.id
}))));
r.get('/', wrap(async (req, res) => res.json(await Measurement.find({
  userId: req.user.id
}).sort({
  date: 1
}))));
r.get('/insights', wrap(async (req, res) => {
  const m = await Measurement.find({
    userId: req.user.id
  }).sort({
    date: 1
  });
  const latest = m.at(-1),
    base = m.find(x => latest && new Date(x.date) <= new Date(new Date(latest.date).getTime() - 25 * 86400000)) || m[0];
  res.json({
    baseline: base,
    latest,
    trends: latest && base ? Object.fromEntries(['weight', 'chest', 'waist', 'arms', 'thighs'].map(k => [k, Number(((latest[k] || 0) - (base[k] || 0)).toFixed(1))])) : {}
  });
}));
export default r;
