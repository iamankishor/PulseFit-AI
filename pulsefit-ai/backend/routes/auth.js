import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { route, wrap } from './helpers.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';
const r = route();
const publicUser = u => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  plan: u.plan,
  premiumUntil: u.premiumUntil,
  badges: u.badges,
  avatarUrl: u.avatarUrl,
  bio: u.bio,
  fitnessGoal: u.fitnessGoal,
  experience: u.experience,
  city: u.city
});
const token = u => jwt.sign({
  id: u.id
}, process.env.JWT_SECRET, {
  expiresIn: '7d'
});
r.post('/register', wrap(async (req, res) => {
  const {
    name,
    email,
    password
  } = req.body;
  if (!name || !email || !password || password.length < 8) return res.status(400).json({
    error: 'Name, email and password (8+ chars) required'
  });
  if (await User.exists({
    email: email.toLowerCase()
  })) return res.status(409).json({
    error: 'Email exists'
  });
  const u = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 12)
  });
  res.status(201).json({
    token: token(u),
    user: publicUser(u)
  });
}));
r.post('/login', wrap(async (req, res) => {
  const u = await User.findOne({
    email: String(req.body.email || '').toLowerCase()
  });
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.passwordHash))) return res.status(401).json({
    error: 'Invalid credentials'
  });
  res.json({
    token: token(u),
    user: publicUser(u)
  });
}));
r.get('/me', auth, (req, res) => res.json(publicUser(req.user)));
r.patch('/me', auth, wrap(async (req, res) => {
  const allowed = ['name', 'bio', 'fitnessGoal', 'experience', 'city'];
  const update = {};
  for (const k of allowed) if (typeof req.body[k] === 'string') update[k] = req.body[k].trim().slice(0, k === 'bio' ? 300 : 80);
  if (!update.name && Object.hasOwn(update, 'name')) return res.status(400).json({
    error: 'Name is required'
  });
  const u = await User.findByIdAndUpdate(req.user.id, {
    $set: update
  }, {
    new: true,
    runValidators: true
  });
  res.json(publicUser(u));
}));
r.post('/avatar', auth, upload.single('photo'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({
    error: 'JPEG, PNG or WebP image required (max 5MB)'
  });
  const u = await User.findByIdAndUpdate(req.user.id, {
    $set: {
      avatarUrl: '/uploads/' + req.file.filename
    }
  }, {
    new: true
  });
  res.json(publicUser(u));
}));
r.delete('/avatar', auth, wrap(async (req, res) => {
  const u = await User.findByIdAndUpdate(req.user.id, {
    $unset: {
      avatarUrl: 1
    }
  }, {
    new: true
  });
  res.json(publicUser(u));
}));
export default r;
