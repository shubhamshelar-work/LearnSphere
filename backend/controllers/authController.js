// controllers/authController.js
// Handles registration, login, logout and "who am I".

const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const { sendTokenCookie, clearTokenCookie } = require('../utils/generateToken')

const EMAIL_REGEX = /^\S+@\S+\.\S+$/

// POST /api/auth/register
// Public registration ALWAYS creates a student. Admin accounts are created
// separately with "npm run seed:admin".
const register = asyncHandler(async (req, res) => {
  const name = (req.body.name || '').trim()
  const email = (req.body.email || '').trim().toLowerCase()
  const password = req.body.password || ''

  if (!name || !email || !password) {
    res.status(400)
    throw new Error('Name, email and password are required')
  }
  if (name.length < 3) {
    res.status(400)
    throw new Error('Name must be at least 3 characters')
  }
  if (!EMAIL_REGEX.test(email)) {
    res.status(400)
    throw new Error('Please enter a valid email address')
  }
  if (password.length < 8) {
    res.status(400)
    throw new Error('Password must be at least 8 characters')
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    res.status(400)
    throw new Error('An account with this email already exists')
  }

  const user = await User.create({ name, email, password, role: 'student' })

  sendTokenCookie(res, user._id)

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: user.toJSON(),
  })
})

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase()
  const password = req.body.password || ''

  if (!email || !password) {
    res.status(400)
    throw new Error('Email and password are required')
  }

  // We must ask for the password explicitly because the schema hides it.
  const user = await User.findOne({ email }).select('+password')

  if (!user || !(await user.matchPassword(password))) {
    res.status(401)
    throw new Error('Invalid email or password')
  }

  sendTokenCookie(res, user._id)

  res.json({
    success: true,
    message: 'Login successful',
    user: user.toJSON(),
  })
})

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res)
  res.json({ success: true, message: 'Logged out successfully' })
})

// GET /api/auth/me  (protected)
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() })
})

module.exports = { register, login, logout, getMe }
