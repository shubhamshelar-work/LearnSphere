// models/Progress.js
// Collection: progress
// One document per student per course. Tracks completed lessons and quiz attempts.

const mongoose = require('mongoose')

// A single quiz attempt record.
const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    // Completed lesson ids (the _id of each lesson subdocument).
    completedLessons: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    quizAttempts: { type: [quizAttemptSchema], default: [] },
    lastAccessedLesson: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
)

// One student can have only one progress document per course.
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true })

module.exports = mongoose.model('Progress', progressSchema)
