// tests/quizService.test.js
// Unit tests for the server-side quiz logic. No database needed.

const test = require('node:test')
const assert = require('node:assert/strict')

const quizService = require('../services/quizService')

function makeQuiz(overrides = {}) {
  return {
    _id: 'quiz1',
    courseId: 'course1',
    moduleId: 'module1',
    title: 'Sample Quiz',
    timeLimit: 10,
    passingPercentage: 60,
    shuffleQuestions: false,
    shuffleOptions: false,
    showExplanations: true,
    questions: [
      {
        _id: 'q1',
        questionText: 'What is 2 + 2?',
        options: [
          { id: 'a', label: '3' },
          { id: 'b', label: '4' },
        ],
        correctOptionId: 'b',
        marks: 2,
        explanation: 'Basic arithmetic.',
      },
      {
        _id: 'q2',
        questionText: 'What color is the sky?',
        options: [
          { id: 'a', label: 'Blue' },
          { id: 'b', label: 'Green' },
        ],
        correctOptionId: 'a',
        marks: 2,
        explanation: 'On a clear day it looks blue.',
      },
    ],
    ...overrides,
  }
}

// A tiny fake attempt object (plain object; the real one is a Mongoose doc).
function makeAttempt(quiz, answers = {}, extra = {}) {
  return {
    _id: 'attempt1',
    quizId: quiz._id,
    courseId: quiz.courseId,
    status: 'in_progress',
    startedAt: new Date('2026-01-01T10:00:00Z'),
    deadline: new Date('2026-01-01T10:10:00Z'),
    submittedAt: null,
    questionOrder: quiz.questions.map((q) => q._id),
    optionOrder: new Map(quiz.questions.map((q) => [q._id, q.options.map((o) => o.id)])),
    answers: new Map(Object.entries(answers)),
    tabSwitches: 0,
    ...extra,
  }
}

test('buildNewAttemptData issues a deadline from the time limit', () => {
  const quiz = makeQuiz()
  const now = new Date('2026-01-01T10:00:00Z')
  const data = quizService.buildNewAttemptData(quiz, now)
  assert.equal(data.deadline.toISOString(), '2026-01-01T10:10:00.000Z')
  assert.equal(data.questionOrder.length, 2)
})

test('buildNewAttemptData shuffles options when configured', () => {
  // With many options, shuffled order should differ at least once across tries.
  const quiz = makeQuiz({
    shuffleOptions: true,
    questions: [
      {
        _id: 'q1',
        questionText: 'Pick one',
        options: 'abcdefgh'.split('').map((id) => ({ id, label: id })),
        correctOptionId: 'a',
        marks: 1,
        explanation: '',
      },
    ],
  })
  let sawDifference = false
  for (let i = 0; i < 20; i += 1) {
    const data = quizService.buildNewAttemptData(quiz)
    const order = data.optionOrder.q1
    assert.deepEqual([...order].sort(), 'abcdefgh'.split(''))
    if (order.join('') !== 'abcdefgh') sawDifference = true
  }
  assert.equal(sawDifference, true)
})

test('gradeAttempt scores correct answers and hides the key when policy says so', () => {
  const quiz = makeQuiz()
  const attempt = makeAttempt(quiz, { q1: 'b', q2: 'a' })
  const result = quizService.gradeAttempt(quiz, attempt, new Date('2026-01-01T10:05:00Z'))
  assert.equal(result.score, 4)
  assert.equal(result.totalMarks, 4)
  assert.equal(result.percentage, 100)
  assert.equal(result.passed, true)
  assert.equal(result.timeTakenSeconds, 300)
  assert.equal(result.details[0].explanation, 'Basic arithmetic.')
})

test('gradeAttempt counts missing answers as wrong', () => {
  const quiz = makeQuiz()
  const attempt = makeAttempt(quiz, { q1: 'b' })
  const result = quizService.gradeAttempt(quiz, attempt)
  assert.equal(result.score, 2)
  assert.equal(result.percentage, 50)
  const q2 = result.details.find((d) => d.questionId === 'q2')
  assert.equal(q2.selectedOptionId, null)
  assert.equal(q2.isCorrect, false)
})

test('gradeAttempt omits correct answers when explanations are disabled', () => {
  const quiz = makeQuiz({ showExplanations: false })
  const attempt = makeAttempt(quiz, { q1: 'b', q2: 'a' })
  const result = quizService.gradeAttempt(quiz, attempt)
  assert.equal(result.details[0].correctOptionId, undefined)
  assert.equal(result.details[0].explanation, undefined)
})

test('buildAttemptState never exposes the answer key', () => {
  const quiz = makeQuiz()
  const attempt = makeAttempt(quiz, { q1: 'b' })
  const state = quizService.buildAttemptState(quiz, attempt, new Date('2026-01-01T10:00:00Z'))
  const serialized = JSON.stringify(state)
  assert.equal(serialized.includes('correctOptionId'), false)
  assert.equal(serialized.includes('explanation'), false)
  assert.equal(state.secondsLeft, 600)
  assert.equal(state.answers.q1, 'b')
})

test('validateAnswers rejects unknown questions and invalid options', () => {
  const quiz = makeQuiz()
  assert.throws(() => quizService.validateAnswers(quiz, { nope: 'a' }), /Unknown question/)
  assert.throws(() => quizService.validateAnswers(quiz, { q1: 'z' }), /Invalid option/)
  const ok = quizService.validateAnswers(quiz, { q1: 'b' })
  assert.deepEqual(ok, { q1: 'b' })
})

test('findActiveAttempt only returns open in-progress attempts', () => {
  const now = new Date('2026-01-01T10:05:00Z')
  const open = { status: 'in_progress', deadline: new Date('2026-01-01T10:10:00Z') }
  const late = { status: 'in_progress', deadline: new Date('2026-01-01T09:00:00Z') }
  const done = { status: 'submitted', deadline: new Date('2026-01-01T10:10:00Z') }
  assert.equal(quizService.findActiveAttempt([late, open, done], now), open)
  assert.equal(quizService.findActiveAttempt([late, done], now), undefined)
})
