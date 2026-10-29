// services/quizService.js
// Reusable quiz-attempt logic: building the server-issued attempt state,
// shuffling order, and server-side grading. Controllers stay thin.

const { shuffleArray } = require('../utils/shuffle')

function questionId(question) {
  return question._id ? question._id.toString() : String(question.id)
}

function round2(value) {
  return Math.round(value * 100) / 100
}

// How many attempts has this student used for this quiz?
function countAttempts(attempts) {
  return attempts.length
}

// Is there an attempt that is still open (started but not submitted and not past
// its deadline)?
function findActiveAttempt(attempts, now = new Date()) {
  return attempts.find(
    (attempt) => attempt.status === 'in_progress' && attempt.deadline > now,
  )
}

// Create the shape of a new attempt. Only the server decides the deadline and
// the shuffled order.
function buildNewAttemptData(quiz, now = new Date()) {
  const questions = quiz.questions || []

  const orderedQuestions = quiz.shuffleQuestions
    ? shuffleArray(questions)
    : questions.slice()

  const questionOrder = orderedQuestions.map((question) => question._id)

  const optionOrder = {}
  questions.forEach((question) => {
    const optionIds = question.options.map((option) => option.id)
    optionOrder[questionId(question)] = quiz.shuffleOptions
      ? shuffleArray(optionIds)
      : optionIds
  })

  const timeLimitMs = quiz.timeLimit * 60 * 1000
  const deadline = new Date(now.getTime() + timeLimitMs)

  return { questionOrder, optionOrder, deadline, startedAt: now }
}

// The safe payload a student sees for an active attempt. Never contains the
// correct answers.
function buildAttemptState(quiz, attempt, now = new Date()) {
  const questionsById = new Map(
    (quiz.questions || []).map((question) => [questionId(question), question]),
  )

  const order = (attempt.questionOrder || []).map((id) => id.toString())
  const optionOrder = attempt.optionOrder || new Map()
  const savedAnswers = attempt.answers || new Map()

  const questions = order
    .map((qid) => {
      const question = questionsById.get(qid)
      if (!question) return null

      const ids = optionOrder.get(qid) || question.options.map((option) => option.id)
      const optionsById = new Map(question.options.map((option) => [option.id, option]))

      const orderedOptions = ids
        .map((optionId) => optionsById.get(optionId))
        .filter(Boolean)
        .map((option) => ({ id: option.id, label: option.label }))

      return {
        _id: qid,
        questionText: question.questionText,
        marks: question.marks || 1,
        options: orderedOptions,
      }
    })
    .filter(Boolean)

  const answers = {}
  savedAnswers.forEach((value, key) => {
    answers[key] = value
  })

  const secondsLeft = Math.max(0, Math.round((attempt.deadline - now) / 1000))

  return {
    attemptId: attempt._id,
    quizId: quiz._id,
    courseId: quiz.courseId,
    moduleId: quiz.moduleId,
    title: quiz.title,
    status: attempt.status,
    timeLimit: quiz.timeLimit,
    passingPercentage: quiz.passingPercentage,
    showExplanations: quiz.showExplanations,
    questionCount: questions.length,
    deadline: attempt.deadline,
    serverNow: now,
    secondsLeft,
    tabSwitches: attempt.tabSwitches || 0,
    questions,
    answers,
  }
}

// Grade an attempt using the stored answer key. Returns the graded result and
// the review details (which may hide explanations per quiz policy).
function gradeAttempt(quiz, attempt, submittedAt = new Date()) {
  const questionsById = new Map(
    (quiz.questions || []).map((question) => [questionId(question), question]),
  )
  const order = (attempt.questionOrder || []).map((id) => id.toString())
  const savedAnswers = attempt.answers || new Map()

  let score = 0
  let totalMarks = 0
  const details = []

  order.forEach((qid) => {
    const question = questionsById.get(qid)
    if (!question) return

    const marks = question.marks || 1
    totalMarks += marks

    const selectedOptionId = savedAnswers.get(qid) || null
    const isCorrect = selectedOptionId === question.correctOptionId
    if (isCorrect) score += marks

    const detail = {
      questionId: qid,
      questionText: question.questionText,
      selectedOptionId,
      isCorrect,
      marks,
    }

    // Correct answers and explanations are only revealed when the quiz policy
    // allows it.
    if (quiz.showExplanations) {
      detail.correctOptionId = question.correctOptionId
      detail.explanation = question.explanation || ''
    }

    details.push(detail)
  })

  const percentage = totalMarks > 0 ? round2((score / totalMarks) * 100) : 0
  const passed = percentage >= quiz.passingPercentage

  const startMs = new Date(attempt.startedAt).getTime()
  const endMs = new Date(submittedAt).getTime()
  const maxSeconds = quiz.timeLimit * 60
  const timeTakenSeconds = Math.max(0, Math.min(maxSeconds, Math.round((endMs - startMs) / 1000)))

  return { score, totalMarks, percentage, passed, details, timeTakenSeconds }
}

// Validate a submitted answers object against the quiz. Returns a normalised
// object or throws a descriptive error.
function validateAnswers(quiz, rawAnswers) {
  if (rawAnswers === undefined || rawAnswers === null) return {}

  const questionsById = new Map(
    (quiz.questions || []).map((question) => [questionId(question), question]),
  )

  const normalized = {}
  Object.entries(rawAnswers).forEach(([qid, optionId]) => {
    const question = questionsById.get(qid)
    if (!question) {
      throw Object.assign(new Error(`Unknown question "${qid}" in this quiz`), { statusCode: 400 })
    }
    if (optionId !== null && optionId !== undefined) {
      const valid = question.options.some((option) => option.id === optionId)
      if (!valid) {
        throw Object.assign(
          new Error(`Invalid option "${optionId}" submitted for question "${qid}"`),
          { statusCode: 400 },
        )
      }
      normalized[qid] = optionId
    }
  })

  return normalized
}

module.exports = {
  questionId,
  countAttempts,
  findActiveAttempt,
  buildNewAttemptData,
  buildAttemptState,
  gradeAttempt,
  validateAnswers,
}
