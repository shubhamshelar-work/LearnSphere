// models/Quiz.js
// Collection: quizzes
// A quiz belongs to one course module. The answer key (correctOptionId +
// explanation) lives here and must never be sent to the browser before a
// student submits an attempt.

const mongoose = require('mongoose')

// Each option has a stable id (for example "a", "b") and a label.
const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: [true, 'Option id is required'] },
    label: { type: String, required: [true, 'Option label is required'] },
  },
  { _id: false },
)

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: [true, 'Question text is required'] },
  options: {
    type: [optionSchema],
    validate: {
      validator: (options) => Array.isArray(options) && options.length >= 2,
      message: 'A question needs at least two options',
    },
  },
  correctOptionId: { type: String, required: [true, 'A correct option is required'] },
  marks: { type: Number, default: 1, min: 0 },
  explanation: { type: String, default: '' },
})

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    // The _id of the module subdocument this quiz belongs to.
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: { type: String, required: [true, 'Quiz title is required'], trim: true },
    description: { type: String, default: '' },
    timeLimit: { type: Number, default: 10, min: 1 }, // minutes
    passingPercentage: { type: Number, default: 60, min: 0, max: 100 },
    // 0 means unlimited attempts.
    attemptLimit: { type: Number, default: 0, min: 0 },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showExplanations: { type: Boolean, default: true },
    published: { type: Boolean, default: false },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true },
)

// One quiz per module.
quizSchema.index({ courseId: 1, moduleId: 1 }, { unique: true })

// Safe version for students before/during an attempt (no answer key).
quizSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    courseId: this.courseId,
    moduleId: this.moduleId,
    title: this.title,
    description: this.description,
    timeLimit: this.timeLimit,
    passingPercentage: this.passingPercentage,
    attemptLimit: this.attemptLimit,
    shuffleQuestions: this.shuffleQuestions,
    shuffleOptions: this.shuffleOptions,
    showExplanations: this.showExplanations,
    questionCount: this.questions.length,
    questions: this.questions.map((question) => ({
      _id: question._id,
      questionText: question.questionText,
      marks: question.marks,
      options: question.options.map((option) => ({ id: option.id, label: option.label })),
      // correctOptionId and explanation are intentionally NOT included
    })),
  }
}

// Full version for admins editing the quiz.
quizSchema.methods.toAdminJSON = function toAdminJSON() {
  return {
    _id: this._id,
    courseId: this.courseId,
    moduleId: this.moduleId,
    title: this.title,
    description: this.description,
    timeLimit: this.timeLimit,
    passingPercentage: this.passingPercentage,
    attemptLimit: this.attemptLimit,
    shuffleQuestions: this.shuffleQuestions,
    shuffleOptions: this.shuffleOptions,
    showExplanations: this.showExplanations,
    published: this.published,
    questionCount: this.questions.length,
    questions: this.questions.map((question) => ({
      _id: question._id,
      questionText: question.questionText,
      marks: question.marks,
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      options: question.options.map((option) => ({ id: option.id, label: option.label })),
    })),
  }
}

module.exports = mongoose.model('Quiz', quizSchema)
