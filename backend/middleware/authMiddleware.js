// middleware/authMiddleware.js
// Checks that the request carries a valid JWT and loads the user.

const jwt = require('jsonwebtoken')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const { COOKIE_NAME } = require('../utils/generateToken')

const protect = asyncHandler(async (req, res, next) => {
  let token = null

  // 1. Prefer the HttpOnly cookie.
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME]
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // 2. Fall back to a Bearer token (useful for testing tools).
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    res.status(401)
    throw new Error('Not authorized, no token provided')
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    res.status(401)
    throw new Error('Not authorized, token is invalid or expired')
  }

  const user = await User.findById(decoded.userId)
  if (!user) {
    res.status(401)
    throw new Error('Not authorized, user no longer exists')
  }

  req.user = user
  next()
})

module.exports = { protect }
