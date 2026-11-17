import { Photo } from '../models/index.js';
import { upload } from '../utils/upload.js';
import { route, wrap } from './helpers.js';
const r = route();
r.post('/upload', upload.single('photo'), wrap(async (req, res) => req.file ? res.status(201).json(await Photo.create({
  userId: req.user.id,
  imageUrl: '/uploads/' + req.file.filename,
  weight: req.body.weight,
  notes: req.body.notes
})) : res.status(400).json({
  error: 'Image required'
})));
r.get('/', wrap(async (req, res) => res.json(await Photo.find({
  userId: req.user.id
}).sort({
  date: 1
}))));
r.delete('/:id', wrap(async (req, res) => {
  await Photo.deleteOne({
    _id: req.params.id,
    userId: req.user.id
  });
  res.json({
    ok: true
  });
}));
export default r;
