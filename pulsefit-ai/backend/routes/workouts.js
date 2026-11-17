import { Workout } from '../models/index.js';
import { route, wrap, paginate } from './helpers.js';
import { awardBadges } from '../utils/badges.js';
const r = route();
r.post('/', wrap(async (req, res) => {
  const exercises = (req.body.exercises || []).map(e => ({
    name: String(e.name || '').trim(),
    sets: (e.sets || []).map(s => ({
      reps: Number(s.reps),
      weight: Number(s.weight)
    }))
  }));
  if (!exercises.length || exercises.some(e => !e.name || !e.sets.length || e.sets.some(s => !Number.isFinite(s.reps) || !Number.isFinite(s.weight) || s.reps < 0 || s.weight < 0))) return res.status(400).json({
    error: 'Invalid exercises'
  });
  const prev = await Workout.find({
    userId: req.user.id
  });
  const prs = [];
  for (const e of exercises) {
    e.volume = e.sets.reduce((a, s) => a + s.reps * s.weight, 0);
    const best = Math.max(0, ...prev.flatMap(w => w.exercises.filter(x => x.name.toLowerCase() === e.name.toLowerCase()).flatMap(x => x.sets.map(s => s.weight))));
    if (e.sets.some(s => s.weight > best)) prs.push(e.name);
  }
  const w = await Workout.create({
    userId: req.user.id,
    date: req.body.date || new Date(),
    exercises,
    volume: exercises.reduce((s, e) => s + e.volume, 0),
    isPR: prs
  });
  await awardBadges(req.user);
  res.status(201).json(w);
}));
r.get('/', wrap(async (req, res) => {
  const filter = {
    userId: req.user.id
  };
  if (req.query.exercise) filter['exercises.name'] = {
    $regex: String(req.query.exercise).replace(/[^a-zA-Z0-9 ]/g, ''),
    $options: 'i'
  };
  let result = await paginate(Workout, filter, req.query, {
    date: -1
  });
  if (req.query.search) result.items = result.items.filter(w => w.exercises.some(e => e.name.toLowerCase().includes(String(req.query.search).toLowerCase())));
  res.json(result);
}));
r.get('/:id', wrap(async (req, res) => {
  const w = await Workout.findOne({
    _id: req.params.id,
    userId: req.user.id
  });
  if (!w) return res.sendStatus(404);
  res.json(w);
}));
r.delete('/:id', wrap(async (req, res) => {
  await Workout.deleteOne({
    _id: req.params.id,
    userId: req.user.id
  });
  await awardBadges(req.user);
  res.json({
    ok: true
  });
}));
export default r;
