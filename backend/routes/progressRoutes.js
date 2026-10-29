// routes/progressRoutes.js
const express = require('express')
const {
  getProgress,
  getMyProgress,
  markLessonComplete,
  markLessonIncomplete,
} = require('../controllers/progressController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

// All routes require a logged-in student.
router.get('/', protect, getMyProgress)
router.put('/lessons/:lessonId/complete', protect, markLessonComplete)
router.put('/lessons/:lessonId/incomplete', protect, markLessonIncomplete)
router.get('/:courseId', protect, getProgress)

module.exports = router
