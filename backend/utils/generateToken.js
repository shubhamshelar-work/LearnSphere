// utils/generateToken.js
// Creates a JWT and stores it in an HttpOnly cookie.

const jwt = require('jsonwebtoken')

const COOKIE_NAME = 'token'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

// Settings for the auth cookie.
// - httpOnly: JavaScript in the browser cannot read it (protects against XSS).
// - secure: only sent over HTTPS (enabled automatically in production).
// - sameSite: "lax" works for local development, "none" is needed for
//   cross-domain production (and "none" requires secure to be true).
function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SEVEN_DAYS_MS,
  }
}

function generateToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Add it to backend/.env')
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// Signs a token for the user and sets it as a cookie on the response.
function sendTokenCookie(res, userId) {
  const token = generateToken(userId)
  res.cookie(COOKIE_NAME, token, cookieOptions())
  return token
}

// Removes the auth cookie.
function clearTokenCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  })
}

module.exports = { COOKIE_NAME, sendTokenCookie, clearTokenCookie }
