import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { auth } from './middleware/auth.js';
import { apiLimit, authLimit } from './middleware/rateLimit.js';
import { initSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import workouts from './routes/workouts.js';
import stats from './routes/stats.js';
import coach from './routes/coach.js';
import food from './routes/food.js';
import foods from './routes/foods.js';
import measurements from './routes/measurements.js';
import photos from './routes/photos.js';
import challenges from './routes/challenges.js';
import requests from './routes/requests.js';
import buddies from './routes/buddies.js';
import chat from './routes/chat.js';
import status from './routes/status.js';
import notifications from './routes/notifications.js';
import programs from './routes/programs.js';
import diet from './routes/diet.js';
import admin from './routes/admin.js';
const app = express();
const origins = [...new Set(['http://localhost:5173', 'http://127.0.0.1:5173', ...(process.env.CLIENT_URL || '').split(',').filter(Boolean)])];
app.use(cors({
  origin: origins
}));
app.use(express.json({
  limit: '1mb'
}));
app.use('/uploads', express.static('uploads'));
app.use('/api', apiLimit);
app.get('/api/health', (req, res) => res.json({
  ok: true,
  service: 'pulsefit-backend',
  version: '4.0.0'
}));
app.use('/api/auth', authLimit, authRoutes);
for (const [name, r] of Object.entries({
  workouts,
  stats,
  coach,
  food,
  foods,
  measurements,
  photos,
  challenges,
  requests,
  buddies,
  chat,
  status,
  notifications,
  programs,
  diet,
  admin
})) app.use('/api/' + name, auth, r);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Server error'
  });
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: origins
  }
});
app.set('io', io);
initSocket(io);
connectDB().then(() => server.listen(process.env.PORT || 5000, () => console.log('API running on port ' + (process.env.PORT || 5000)))).catch(e => {
  console.error(e);
  process.exit(1);
});
