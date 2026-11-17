import { BuddyProfile } from '../models/index.js';
import { route, wrap, pageParams } from './helpers.js';
const r = route();
r.put('/me', wrap(async (req, res) => res.json(await BuddyProfile.findOneAndUpdate({
  userId: req.user.id
}, {
  $set: {
    displayName: req.body.displayName || req.user.name,
    lat: req.body.lat,
    lng: req.body.lng,
    goals: req.body.goals || [],
    bio: req.body.bio || ''
  }
}, {
  upsert: true,
  new: true
}))));
r.get('/me', wrap(async (req, res) => res.json(await BuddyProfile.findOne({
  userId: req.user.id
}))));
r.get('/nearby', wrap(async (req, res) => {
  const {
    page,
    limit
  } = pageParams(req.query);
  const profiles = await BuddyProfile.find({
    userId: {
      $ne: req.user.id
    }
  }).populate('userId', 'name avatarUrl fitnessGoal experience city');
  const rad = x => x * Math.PI / 180;
  const lat = Number(req.query.lat) || 28.61,
    lng = Number(req.query.lng) || 77.21;
  const items = profiles.map(p => {
    const a = Math.sin(rad(p.lat - lat) / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(p.lat)) * Math.sin(rad(p.lng - lng) / 2) ** 2;
    return {
      ...p.toObject(),
      distanceKm: Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
    };
  }).filter(p => !req.query.search || p.displayName.toLowerCase().includes(String(req.query.search).toLowerCase())).sort((a, b) => a.distanceKm - b.distanceKm);
  res.json({
    items: items.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      total: items.length,
      pages: Math.ceil(items.length / limit)
    }
  });
}));
export default r;
