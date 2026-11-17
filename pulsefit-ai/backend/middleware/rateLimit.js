import rateLimit from 'express-rate-limit';
export const apiLimit = rateLimit({
  windowMs: 900000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});
export const authLimit = rateLimit({
  windowMs: 900000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});
