import { Workout } from '../models/index.js';
export const catalogue = [['first-workout', 'First Rep'], ['streak-3', '3-Day Streak'], ['streak-7', 'Week Warrior'], ['streak-30', 'Unstoppable'], ['volume-10k', '10K Club'], ['volume-100k', '100K Club'], ['workouts-50', 'Half Century'], ['pr-10', 'PR Crusher']];
export function streakOf(workouts) {
  const days = new Set(workouts.map(w => new Date(w.date).toISOString().slice(0, 10)));
  let d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (days.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}
export async function awardBadges(user) {
  const ws = await Workout.find({
    userId: user._id
  });
  const volume = ws.reduce((s, w) => s + (w.volume || 0), 0),
    streak = streakOf(ws),
    prs = new Set(ws.flatMap(w => w.isPR || []));
  const b = [];
  if (ws.length) b.push('first-workout');
  for (const [n, k] of [[3, 'streak-3'], [7, 'streak-7'], [30, 'streak-30']]) if (streak >= n) b.push(k);
  if (volume >= 10000) b.push('volume-10k');
  if (volume >= 100000) b.push('volume-100k');
  if (ws.length >= 50) b.push('workouts-50');
  if (prs.size >= 10) b.push('pr-10');
  user.badges = b;
  await user.save();
}
