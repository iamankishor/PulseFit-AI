import { Workout } from '../models/index.js';
import { streakOf } from '../utils/badges.js';
import { route, wrap } from './helpers.js';
const r = route();
r.get('/dashboard', wrap(async (req, res) => {
  const ws = await Workout.find({
    userId: req.user.id
  }).sort({
    date: -1
  });
  const week = new Date(Date.now() - 7 * 86400000);
  res.json({
    totalWorkouts: ws.length,
    streak: streakOf(ws),
    totalVolume: ws.reduce((s, w) => s + w.volume, 0),
    weekVolume: ws.filter(w => w.date >= week).reduce((s, w) => s + w.volume, 0),
    badgeCount: req.user.badges.length,
    recent: ws.slice(0, 5)
  });
}));
r.get('/volume-series', wrap(async (req, res) => {
  const ws = await Workout.find({
    userId: req.user.id
  });
  const data = Array.from({
    length: 12
  }, (_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (11 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {
      week: `W${i + 1}`,
      volume: ws.filter(w => w.date >= start && w.date < end).reduce((s, w) => s + w.volume, 0)
    };
  });
  res.json(data);
}));
r.get('/exercise-progress', wrap(async (req, res) => {
  const ws = await Workout.find({
    userId: req.user.id
  }).sort({
    date: 1
  });
  res.json(ws.flatMap(w => w.exercises.filter(e => e.name.toLowerCase() === String(req.query.exercise || '').toLowerCase()).map(e => ({
    date: w.date,
    maxWeight: Math.max(...e.sets.map(s => s.weight))
  }))));
}));
export default r;
