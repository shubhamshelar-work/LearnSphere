// tests/validate.test.js
// Unit tests for the shared validation helpers.

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  isNonEmptyString,
  isValidObjectId,
  extractYouTubeId,
  isSupportedYouTubeUrl,
} = require('../utils/validate')

test('isNonEmptyString', () => {
  assert.equal(isNonEmptyString('hi'), true)
  assert.equal(isNonEmptyString('   '), false)
  assert.equal(isNonEmptyString(123), false)
})

test('isValidObjectId accepts real ids and rejects junk', () => {
  assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true)
  assert.equal(isValidObjectId('abc'), false)
  assert.equal(isValidObjectId(''), false)
})

test('extractYouTubeId supports the expected URL shapes', () => {
  assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(extractYouTubeId('https://vimeo.com/12345'), null)
  assert.equal(extractYouTubeId('not a url'), null)
})

test('isSupportedYouTubeUrl allows empty but rejects unsupported URLs', () => {
  assert.equal(isSupportedYouTubeUrl(''), true)
  assert.equal(isSupportedYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), true)
  assert.equal(isSupportedYouTubeUrl('https://vimeo.com/12345'), false)
})
