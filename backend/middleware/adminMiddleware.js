// middleware/adminMiddleware.js
// Allows the request only when the logged-in user has the "admin" role.
// Always use it AFTER "protect", which is what attaches req.user.

function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next()
  }
  res.status(403)
  return next(new Error('Access denied: admin role required'))
}

module.exports = { adminOnly }
