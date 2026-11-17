import { User, Workout, Challenge, Program, FoodLog, Message, BuddyRequest } from '../models/index.js';
import { requireAdmin } from '../middleware/roles.js';
import { route, wrap, paginate } from './helpers.js';
const r = route();
r.use(requireAdmin);
r.get('/overview', wrap(async (req, res) => {
  const [users, workouts, foodLogs, messages, buddyConnections, latest] = await Promise.all([User.countDocuments(), Workout.countDocuments(), FoodLog.countDocuments(), Message.countDocuments(), BuddyRequest.countDocuments({
    status: 'accepted'
  }), User.find().sort({
    createdAt: -1
  }).limit(6).select('name email avatarUrl role createdAt')]);
  res.json({
    users,
    workouts,
    foodLogs,
    messages,
    buddyConnections,
    latest
  });
}));
r.get('/stats', wrap(async (req, res) => {
  const [users, workouts, challenges, programs, vol, newestUsers] = await Promise.all([User.countDocuments(), Workout.countDocuments(), Challenge.countDocuments(), Program.countDocuments(), Workout.aggregate([{
    $group: {
      _id: null,
      total: {
        $sum: '$volume'
      }
    }
  }]), User.find().sort({
    createdAt: -1
  }).limit(5).select('-passwordHash')]);
  res.json({
    users,
    workouts,
    challenges,
    programs,
    totalVolume: vol[0]?.total || 0,
    newestUsers
  });
}));
r.get('/users', wrap(async (req, res) => {
  const f = {};
  if (req.query.role) f.role = req.query.role;
  if (req.query.search) f.$or = [{
    name: {
      $regex: req.query.search,
      $options: 'i'
    }
  }, {
    email: {
      $regex: req.query.search,
      $options: 'i'
    }
  }];
  const out = await paginate(User, f, req.query);
  out.items = out.items.map(u => {
    const x = u.toObject();
    delete x.passwordHash;
    return x;
  });
  res.json(out);
}));
r.patch('/users/:id/role', wrap(async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({
    error: 'Cannot change own role'
  });
  if (!['user', 'coach', 'admin'].includes(req.body.role)) return res.sendStatus(400);
  res.json(await User.findByIdAndUpdate(req.params.id, {
    role: req.body.role
  }, {
    new: true
  }).select('-passwordHash'));
}));
export default r;
