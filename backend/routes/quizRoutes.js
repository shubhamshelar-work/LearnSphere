// routes/quizRoutes.js
const express = require('express')
const {
  getQuizzesByCourse,
  getQuizByModule,
  getQuizById,
  startAttempt,
  getAttempt,
  saveAnswers,
  recordEvent,
  submitAttempt,
  getMyAttempts,
  getQuizForAdmin,
  getQuizByModuleForAdmin,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} = require('../controllers/quizController')
const { protect } = require('../middleware/authMiddleware')
const { adminOnly } = require('../middleware/adminMiddleware')

const router = express.Router()

// Public listing (specific paths declared before the generic ":quizId").
router.get('/course/:courseId', getQuizzesByCourse)
router.get('/module/:courseId/:moduleId', getQuizByModule)

// Student attempt lifecycle (all protected).
router.get('/my-attempts', protect, getMyAttempts)
router.post('/:quizId/start', protect, startAttempt)
router.get('/attempts/:attemptId', protect, getAttempt)
router.patch('/attempts/:attemptId/answers', protect, saveAnswers)
router.post('/attempts/:attemptId/events', protect, recordEvent)
router.post('/attempts/:attemptId/submit', protect, submitAttempt)

// Admin CRUD.
router.get('/admin/module/:courseId/:moduleId', protect, adminOnly, getQuizByModuleForAdmin)
router.get('/:quizId/admin', protect, adminOnly, getQuizForAdmin)
router.post('/', protect, adminOnly, createQuiz)
router.put('/:quizId', protect, adminOnly, updateQuiz)
router.delete('/:quizId', protect, adminOnly, deleteQuiz)

// Public read of a single published quiz (no answer key).
router.get('/:quizId', getQuizById)

module.exports = router
