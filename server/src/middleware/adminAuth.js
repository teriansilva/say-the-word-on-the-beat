/**
 * Admin authentication middleware.
 * Validates the Authorization header against the ADMIN_PASSWORD env var.
 * Usage: router.use(requireAdmin)
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const token = authHeader.slice(7);

  if (token !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Invalid admin password' });
  }

  next();
}

module.exports = { requireAdmin };
