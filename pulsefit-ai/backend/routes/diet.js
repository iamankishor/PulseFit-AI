import { DietPlan } from '../models/index.js';
import { generateDiet } from '../utils/diet.js';
import { route, wrap } from './helpers.js';
const r = route();
r.post('/plan', wrap(async (req, res) => {
  const data = generateDiet(req.body);
  res.json(await DietPlan.findOneAndUpdate({
    userId: req.user.id
  }, {
    $set: data
  }, {
    upsert: true,
    new: true
  }));
}));
r.get('/plan', wrap(async (req, res) => res.json(await DietPlan.findOne({
  userId: req.user.id
}))));
export default r;
