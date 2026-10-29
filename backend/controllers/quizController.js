// controllers/quizController.js
// Quiz listing, secure server-controlled attempts, and admin quiz CRUD.
//
// Security rules enforced here:
//  - correct answers / explanations never reach the client before submission
//  - the deadline and question/option order are issued by the server
//  - grading always happens on the server
//  - a student can only read or change their own attempts

const Quiz = require('../models/Quiz')
const Course = require('../models/Course')
const Progress = require('../models/Progress')
const QuizAttempt = require('../models/QuizAttempt')
const asyncHandler = require('../utils/asyncHandler')
const quizService = require('../services/quizService')
const { isNonEmptyString, isValidObjectId, toInt } = require('../utils/validate')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Validate and normalise a quiz payload coming from an admin. Throws a 400 error
// on invalid input.
function sanitizeQuizPayload(body) {
  if (!isNonEmptyString(body.title)) {
    throw Object.assign(new Error('Quiz title is required'), { statusCode: 400 })
  }
  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    throw Object.assign(new Error('A quiz needs at least one question'), { statusCode: 400 })
  }

  const questions = body.questions.map((question, index) => {
    const label = `Question ${index + 1}`
    if (!isNonEmptyString(question.questionText)) {
      throw Object.assign(new Error(`${label}: question text is required`), { statusCode: 400 })
    }
    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw Object.assign(new Error(`${label}: at least two options are required`), { statusCode: 400 })
    }

    const seen = new Set()
    const options = question.options.map((option, optionIndex) => {
      const id = isNonEmptyString(option.id) ? option.id.trim() : String(optionIndex)
      if (seen.has(id)) {
        throw Object.assign(new Error(`${label}: duplicate option id "${id}"`), { statusCode: 400 })
      }
      seen.add(id)
      if (!isNonEmptyString(option.label)) {
        throw Object.assign(new Error(`${label}: option ${optionIndex + 1} needs a label`), { statusCode: 400 })
      }
      return { id, label: option.label.trim() }
    })

    if (!seen.has(question.correctOptionId)) {
      throw Object.assign(
        new Error(`${label}: the correct option must match one of the options`),
        { statusCode: 400 },
      )
    }

    return {
      questionText: question.questionText.trim(),
      options,
      correctOptionId: question.correctOptionId,
      marks: Math.max(0, toInt(question.marks, 1)),
      explanation: isNonEmptyString(question.explanation) ? question.explanation.trim() : '',
    }
  })

  return {
    title: body.title.trim(),
    description: isNonEmptyString(body.description) ? body.description.trim() : '',
    timeLimit: Math.max(1, toInt(body.timeLimit, 10)),
    passingPercentage: Math.min(100, Math.max(0, toInt(body.passingPercentage, 60))),
    attemptLimit: Math.max(0, toInt(body.attemptLimit, 0)),
    shuffleQuestions: Boolean(body.shuffleQuestions),
    shuffleOptions: Boolean(body.shuffleOptions),
    showExplanations: body.showExplanations === undefined ? true : Boolean(body.showExplanations),
    published: Boolean(body.published),
    questions,
  }
}

// Turn any in-progress attempts that are past their deadline into graded
// "expired" attempts. This is what stops a student from abandoning a quiz and
// silently getting a fresh timer later.
async function finalizeExpiredAttempts(quiz, userId, now) {
  const expired = await QuizAttempt.find({
    userId,
    quizId: quiz._id,
    status: 'in_progress',
    deadline: { $lte: now },
  })

  for (const attempt of expired) {
    const result = quizService.gradeAttempt(quiz, attempt, attempt.deadline)
    attempt.status = 'expired'
    attempt.submittedAt = attempt.deadline
    attempt.score = result.score
    attempt.totalMarks = result.totalMarks
    attempt.percentage = result.percentage
    attempt.passed = result.passed
    attempt.timeTakenSeconds = result.timeTakenSeconds
    await attempt.save()
  }

  return expired.length
}

async function countFinishedAttempts(userId, quizId) {
  return QuizAttempt.countDocuments({
    userId,
    quizId,
    status: { $in: ['submitted', 'expired'] },
  })
}

function attemptResultPayload(quiz, attempt) {
  const result = quizService.gradeAttempt(quiz, attempt, attempt.submittedAt || new Date())
  return {
    result: {
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      passingPercentage: quiz.passingPercentage,
      passed: result.passed,
      timeTakenSeconds: result.timeTakenSeconds,
    },
    details: result.details,
  }
}

// ---------------------------------------------------------------------------
// Public listing
// ---------------------------------------------------------------------------

// GET /api/quizzes/course/:courseId  (public)
const getQuizzesByCourse = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ courseId: req.params.courseId, published: true })
    .select('title moduleId timeLimit passingPercentage attemptLimit questions')

  const metadata = quizzes.map((quiz) => ({
    _id: quiz._id,
    courseId: quiz.courseId,
    moduleId: quiz.moduleId,
    title: quiz.title,
    timeLimit: quiz.timeLimit,
    passingPercentage: quiz.passingPercentage,
    attemptLimit: quiz.attemptLimit,
    questionCount: quiz.questions.length,
  }))

  res.json({ success: true, count: metadata.length, quizzes: metadata })
})

// GET /api/quizzes/module/:courseId/:moduleId  (public)
// Metadata for the quiz attached to a module. No questions, no answers.
const getQuizByModule = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({
    courseId: req.params.courseId,
    moduleId: req.params.moduleId,
    published: true,
  })

  if (!quiz) {
    res.status(404)
    throw new Error('No published quiz for this module')
  }

  res.json({
    success: true,
    quiz: {
      _id: quiz._id,
      courseId: quiz.courseId,
      moduleId: quiz.moduleId,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      passingPercentage: quiz.passingPercentage,
      attemptLimit: quiz.attemptLimit,
      questionCount: quiz.questions.length,
      codingCount: 0,
    },
  })
})

// GET /api/quizzes/:quizId  (public)
const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.quizId, published: true })

  if (!quiz) {
    res.status(404)
    throw new Error('Quiz not found')
  }

  res.json({ success: true, quiz: quiz.toPublicJSON() })
})

// ---------------------------------------------------------------------------
// Attempt lifecycle
// ---------------------------------------------------------------------------

// POST /api/quizzes/:quizId/start  (protected)
const startAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId)
  if (!quiz) {
    res.status(404)
    throw new Error('Quiz not found')
  }
  if (!quiz.published) {
    res.status(403)
    throw new Error('This quiz is not available yet')
  }

  const course = await Course.findById(quiz.courseId)
  if (!course) {
    res.status(404)
    throw new Error('Course not found')
  }

  const enrolled = await Progress.exists({ userId: req.user._id, courseId: quiz.courseId })
  if (!enrolled) {
    res.status(403)
    throw new Error('You must enrol in the course before taking its quizzes')
  }

  const now = new Date()
  await finalizeExpiredAttempts(quiz, req.user._id, now)

  // Resume an attempt that is still open (a page refresh must not reset it).
  const active = await QuizAttempt.findOne({
    userId: req.user._id,
    quizId: quiz._id,
    status: 'in_progress',
    deadline: { $gt: now },
  })
  if (active) {
    return res.json({ success: true, resumed: true, attempt: quizService.buildAttemptState(quiz, active, now) })
  }

  const used = await countFinishedAttempts(req.user._id, quiz._id)
  if (quiz.attemptLimit > 0 && used >= quiz.attemptLimit) {
    res.status(403)
    throw new Error(`You have reached the maximum of ${quiz.attemptLimit} attempts for this quiz`)
  }

  const data = quizService.buildNewAttemptData(quiz, now)
  const attempt = await QuizAttempt.create({
    userId: req.user._id,
    quizId: quiz._id,
    courseId: quiz.courseId,
    status: 'in_progress',
    startedAt: data.startedAt,
    deadline: data.deadline,
    questionOrder: data.questionOrder,
    optionOrder: data.optionOrder,
    answers: {},
  })

  res.status(201).json({
    success: true,
    resumed: false,
    attempt: quizService.buildAttemptState(quiz, attempt, now),
  })
})

// GET /api/quizzes/attempts/:attemptId  (protected)
// Used to restore an attempt after a refresh. Derives remaining time from the
// server deadline.
const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId)
  if (!attempt || attempt.userId.toString() !== req.user._id.toString()) {
    res.status(404)
    throw new Error('Attempt not found')
  }

  const quiz = await Quiz.findById(attempt.quizId)
  if (!quiz) {
    res.status(404)
    throw new Error('Quiz not found')
  }

  const now = new Date()
  if (attempt.status === 'in_progress' && attempt.deadline <= now) {
    const result = quizService.gradeAttempt(quiz, attempt, attempt.deadline)
    attempt.status = 'expired'
    attempt.submittedAt = attempt.deadline
    attempt.score = result.score
    attempt.totalMarks = result.totalMarks
    attempt.percentage = result.percentage
    attempt.passed = result.passed
    attempt.timeTakenSeconds = result.timeTakenSeconds
    await attempt.save()
  }

  if (attempt.status === 'in_progress') {
    return res.json({ success: true, attempt: quizService.buildAttemptState(quiz, attempt, now) })
  }

  res.json({ success: true, attempt: { attemptId: attempt._id, status: attempt.status }, ...attemptResultPayload(quiz, attempt) })
})

// PATCH /api/quizzes/attempts/:attemptId/answers  (protected)
// Autosave selected options against the active attempt.
const saveAnswers = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId)
  if (!attempt || attempt.userId.toString() !== req.user._id.toString()) {
    res.status(404)
    throw new Error('Attempt not found')
  }
  if (attempt.status !== 'in_progress') {
    res.status(409)
    throw new Error('This attempt is already finished')
  }

  const quiz = await Quiz.findById(attempt.quizId)
  const now = new Date()
  if (attempt.deadline <= now) {
    await finalizeExpiredAttempts(quiz, req.user._id, now)
    res.status(409)
    throw new Error('Time is up for this attempt')
  }

  const normalized = quizService.validateAnswers(quiz, req.body.answers || {})
  Object.entries(normalized).forEach(([qid, optionId]) => {
    attempt.answers.set(qid, optionId)
  })
  attempt.markModified('answers')
  await attempt.save()

  res.json({ success: true, saved: true, count: attempt.answers.size })
})

// POST /api/quizzes/attempts/:attemptId/events  (protected)
// Records a limited integrity signal (tab switch / focus loss).
const recordEvent = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId)
  if (!attempt || attempt.userId.toString() !== req.user._id.toString()) {
    res.status(404)
    throw new Error('Attempt not found')
  }
  if (attempt.status !== 'in_progress') {
    res.status(409)
    throw new Error('This attempt is already finished')
  }

  attempt.tabSwitches = Math.min(1000, (attempt.tabSwitches || 0) + 1)
  await attempt.save()

  res.json({ success: true, tabSwitches: attempt.tabSwitches })
})

// POST /api/quizzes/attempts/:attemptId/submit  (protected)
const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId)
  if (!attempt || attempt.userId.toString() !== req.user._id.toString()) {
    res.status(404)
    throw new Error('Attempt not found')
  }
  if (attempt.status !== 'in_progress') {
    res.status(409)
    throw new Error('This attempt has already been submitted')
  }

  const quiz = await Quiz.findById(attempt.quizId)
  if (!quiz) {
    res.status(404)
    throw new Error('Quiz not found')
  }

  const now = new Date()
  const expired = attempt.deadline <= now

  // New answers are only accepted while the attempt is still open. Grading
  // always uses what was autosaved on the server.
  if (!expired && req.body.answers) {
    const normalized = quizService.validateAnswers(quiz, req.body.answers)
    Object.entries(normalized).forEach(([qid, optionId]) => {
      attempt.answers.set(qid, optionId)
    })
    attempt.markModified('answers')
  }

  const submittedAt = expired ? attempt.deadline : now
  const result = quizService.gradeAttempt(quiz, attempt, submittedAt)

  attempt.status = expired ? 'expired' : 'submitted'
  attempt.submittedAt = submittedAt
  attempt.score = result.score
  attempt.totalMarks = result.totalMarks
  attempt.percentage = result.percentage
  attempt.passed = result.passed
  attempt.timeTakenSeconds = result.timeTakenSeconds
  await attempt.save()

  res.json({
    success: true,
    expired,
    result: {
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      passingPercentage: quiz.passingPercentage,
      passed: result.passed,
      timeTakenSeconds: result.timeTakenSeconds,
    },
    details: result.details,
  })
})

// GET /api/quizzes/my-attempts  (protected)
// Finished attempts for the logged-in student, newest first.
const getMyAttempts = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id, status: { $in: ['submitted', 'expired'] } }
  if (req.query.courseId) {
    if (!isValidObjectId(req.query.courseId)) {
      res.status(400)
      throw new Error('Invalid courseId')
    }
    filter.courseId = req.query.courseId
  }

  const attempts = await QuizAttempt.find(filter)
    .sort({ submittedAt: -1 })
    .populate('quizId', 'title passingPercentage')

  const results = attempts.map((attempt) => ({
    _id: attempt._id,
    quizId: attempt.quizId?._id || null,
    quizTitle: attempt.quizId?.title || 'Quiz',
    courseId: attempt.courseId,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percentage: attempt.percentage,
    passed: attempt.passed,
    status: attempt.status,
    tabSwitches: attempt.tabSwitches,
    timeTakenSeconds: attempt.timeTakenSeconds,
    submittedAt: attempt.submittedAt,
  }))

  res.json({ success: true, count: results.length, attempts: results })
})

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

// GET /api/quizzes/:quizId/admin  (admin)
const getQuizForAdmin = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId)
  if (!quiz) {
    res.status(404)
    throw new Error('Quiz not found')
  }
  res.json({ success: true, quiz: quiz.toAdminJSON() })
})

// GET /api/quizzes/admin/module/:courseId/:moduleId  (admin)
// Lets the admin dashboard load the quiz attached to a module, whether or not
// it is published. Returns 404 when the module has no quiz yet.
const getQuizByModuleForAdmin = asyncHandler(async (req, res) => {
  const { courseId, moduleId } = req.params
  if (!isValidObjectId(courseId) || !isValidObjectId(moduleId)) {
    res.status(400)
    throw new Error('Invalid courseId or moduleId')
  }

  const quiz = await Quiz.findOne({ courseId, moduleId })
  if (!quiz) {
    res.status(404)
    throw new Error('No quiz exists for this module yet')
  }

  res.json({ success: true, quiz: quiz.toAdminJSON() })
})

// POST /api/quizzes  (admin)
const createQuiz = asyncHandler(async (req, res) => {
  const { courseId, moduleId } = req.body
  if (!isValidObjectId(courseId) || !isValidObjectId(moduleId)) {
    res.status(400)
    throw new Error('A valid courseId and moduleId are required')
  }

  const course = await Course.findById(courseId)
  if (!course) {
    res.status(404)
    throw new Error('Course not found')
  }
  const moduleExists = course.modules.some((module) => module._id.toString() === moduleId)
  if (!moduleExists) {
    res.status(400)
    throw new Error('The module does not belong to this course')
  }

  const existing = await Quiz.findOne({ courseId, moduleId })
  if (existing) {
    res.status(400)
    throw new Error('A quiz already exists for this module')
  }

  const payload = sanitizeQuizPayload(req.body)
  const quiz = await Quiz.create({ courseId, moduleId, ...payload })

  res.status(201).json({ success: true, message: 'Quiz created', quiz: quiz.toAdminJSON() })
})

// PUT /api/quizzes/:quizId  (admin)
const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId)
  if (!quiz) {
    res.status(404)
    throw new Error('Quiz not found')
  }

  const payload = sanitizeQuizPayload(req.body)
  Object.assign(quiz, payload)
  await quiz.save()

  res.json({ success: true, message: 'Quiz updated', quiz: quiz.toAdminJSON() })
})

// DELETE /api/quizzes/:quizId  (admin)
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId)
  if (!quiz) {
    res.status(404)
    throw new Error('Quiz not found')
  }
  await quiz.deleteOne()
  res.json({ success: true, message: 'Quiz deleted' })
})

module.exports = {
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
}
