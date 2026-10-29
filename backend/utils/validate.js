// utils/validate.js
// Small, dependency-free validation helpers shared by controllers and services.

const mongoose = require('mongoose')

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isValidObjectId(value) {
  return isNonEmptyString(value) && mongoose.Types.ObjectId.isValid(value)
}

function toInt(value, fallback = null) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.trunc(n)
}

// Accepts the same YouTube URL shapes the frontend supports:
//   youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
const YOUTUBE_ID_REGEX = /^[\w-]{11}$/

function extractYouTubeId(url) {
  if (!isNonEmptyString(url)) return null
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0]
      return YOUTUBE_ID_REGEX.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v')
        return id && YOUTUBE_ID_REGEX.test(id) ? id : null
      }
      const match = parsed.pathname.match(/^\/(embed|shorts)\/([\w-]{11})$/)
      if (match) return match[2]
    }
  } catch {
    return null
  }
  return null
}

function isSupportedYouTubeUrl(url) {
  // Empty is allowed (a lesson may be text-only).
  if (!isNonEmptyString(url)) return true
  return extractYouTubeId(url) !== null
}

module.exports = {
  isNonEmptyString,
  isObject,
  isValidObjectId,
  toInt,
  extractYouTubeId,
  isSupportedYouTubeUrl,
}
