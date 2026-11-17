import { readFileSync } from 'fs';
import { route } from './helpers.js';
const foods = JSON.parse(readFileSync(new URL('../data/foods.json', import.meta.url)));
const r = route();
r.get('/search', (req, res) => res.json(foods.filter(f => f.name.toLowerCase().includes(String(req.query.q || '').toLowerCase())).slice(0, 30)));
export default r;
