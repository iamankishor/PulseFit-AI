import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
export async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id);
    if (!req.user) return res.status(401).json({
      error: 'Unauthorized'
    });
    next();
  } catch (e) {
    res.status(401).json({
      error: 'Unauthorized'
    });
  }
}
