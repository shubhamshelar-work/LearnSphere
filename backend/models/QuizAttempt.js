// models/QuizAttempt.js
// Collection: quizattempts
// One document per quiz attempt. The deadline and the shuffled order are issued
// by the server when the attempt starts, so the client can never extend the
// timer or reorder the questions.

const mongoose = require('mongoose')

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'expired'],
      default: 'in_progress',
      index: true,
    },

    // Server-issued timing. The client always derives remaining time from
    // `deadline`, never from a locally started countdown.
    startedAt: { type: Date, default: Date.now },
    deadline: { type: Date, required: true },
    submittedAt: { type: Date, default: null },

    // Shuffled order of question _ids, fixed for the life of the attempt.
    questionOrder: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    // questionId -> ordered list of option ids, fixed for the attempt.
    optionOrder: { type: Map, of: [String], default: {} },

    // questionId -> selected option id (autosaved while the student works).
    answers: { type: Map, of: String, default: {} },

    // Integrity signal: how many times the student left the tab.
    tabSwitches: { type: Number, default: 0 },

    // Filled in only when the attempt is graded.
    score: { type: Number, default: null },
    totalMarks: { type: Number, default: null },
    percentage: { type: Number, default: null },
    passed: { type: Boolean, default: null },
    timeTakenSeconds: { type: Number, default: null },
  },
  { timestamps: true },
)

// Fast lookups for "attempts of this student for this quiz".
quizAttemptSchema.index({ userId: 1, quizId: 1 })

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema)
