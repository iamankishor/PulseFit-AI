export const requireAdmin = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({
  error: 'admin_required'
});
export const requireCoachOrAdmin = (req, res, next) => ['coach', 'admin'].includes(req.user.role) ? next() : res.status(403).json({
  error: 'coach_required'
});
export async function requirePremium(req, res, next) {
  if (req.user.plan === 'premium' && req.user.premiumUntil && req.user.premiumUntil > new Date()) return next();
  if (req.user.plan === 'premium') {
    req.user.plan = 'free';
    req.user.premiumUntil = null;
    await req.user.save();
  }
  res.status(403).json({
    code: 'premium_required'
  });
}
