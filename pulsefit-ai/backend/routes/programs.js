import { Program, Enrollment } from '../models/index.js';
import { requireCoachOrAdmin } from '../middleware/roles.js';
import { route, wrap } from './helpers.js';
const r = route();
r.get('/', wrap(async (req, res) => {
  const f = {};
  for (const k of ['level', 'goal']) if (req.query[k]) f[k] = req.query[k];
  if (req.query.search) f.name = {
    $regex: String(req.query.search),
    $options: 'i'
  };
  res.json(await Program.find(f));
}));
r.get('/my', wrap(async (req, res) => res.json(await Enrollment.find({
  userId: req.user.id
}).populate('programId'))));
r.post('/', requireCoachOrAdmin, wrap(async (req, res) => res.status(201).json(await Program.create({
  ...req.body,
  createdBy: req.user.id
}))));
r.post('/:id/enroll', wrap(async (req, res) => {
  const p = await Program.findById(req.params.id);
  if (!p) return res.sendStatus(404);
  if (await Enrollment.exists({
    userId: req.user.id,
    programId: p.id
  })) return res.status(409).json({
    error: 'Already enrolled'
  });
  res.status(201).json(await Enrollment.create({
    userId: req.user.id,
    programId: p.id
  }));
}));
r.post('/:id/progress', wrap(async (req, res) => {
  const e = await Enrollment.findOne({
    userId: req.user.id,
    programId: req.params.id
  });
  if (!e) return res.sendStatus(404);
  const p = await Program.findById(req.params.id);
  const match = /^w(\d+)d([1-7])$/.exec(String(req.body.key));
  if (!match || Number(match[1]) > p.durationWeeks || Number(match[2]) > p.daysPerWeek) return res.status(400).json({
    error: 'Invalid day key'
  });
  if (!e.completedDays.includes(req.body.key)) e.completedDays.push(req.body.key);
  e.currentWeek = Math.min(p.durationWeeks, Math.floor(e.completedDays.length / p.daysPerWeek) + 1);
  if (e.completedDays.length >= p.durationWeeks * p.daysPerWeek) e.status = 'completed';
  await e.save();
  res.json(e);
}));
export default r;
