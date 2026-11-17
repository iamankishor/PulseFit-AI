import { FoodLog } from '../models/index.js';
import { route, wrap, day } from './helpers.js';
import { upload } from '../utils/upload.js';
const r = route();
r.get('/', wrap(async (req, res) => res.json((await FoodLog.findOne({
  userId: req.user.id,
  date: req.query.date || day()
})) || {
  meals: []
})));
r.post('/', wrap(async (req, res) => {
  const date = req.body.date || day(),
    meals = req.body.meals || [];
  res.json(await FoodLog.findOneAndUpdate({
    userId: req.user.id,
    date
  }, {
    $set: {
      meals
    }
  }, {
    upsert: true,
    new: true
  }));
}));
r.post('/photo', upload.single('photo'), (req, res) => req.file ? res.json({
  photoUrl: '/uploads/' + req.file.filename
}) : res.status(400).json({
  error: 'Image required'
}));
export default r;
