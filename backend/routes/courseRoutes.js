// routes/courseRoutes.js
const express = require('express')
const {
  getCourses,
  getCoursesForAdmin,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
} = require('../controllers/courseController')
const { protect } = require('../middleware/authMiddleware')
const { adminOnly } = require('../middleware/adminMiddleware')

const router = express.Router()

// Public
router.get('/', getCourses)

// Admin listing (declared before "/:id")
router.get('/admin/all', protect, adminOnly, getCoursesForAdmin)

router.get('/:id', getCourseById)

// Students (must be logged in)
router.post('/:courseId/enroll', protect, enrollInCourse)

// Admin only
router.post('/', protect, adminOnly, createCourse)
router.put('/:id', protect, adminOnly, updateCourse)
router.delete('/:id', protect, adminOnly, deleteCourse)

module.exports = router
