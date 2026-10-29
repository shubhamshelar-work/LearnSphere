// models/Course.js
// Collection: courses
// Modules and lessons are embedded subdocuments inside a single course document.
// This keeps the data model simple: one course = one document.

const mongoose = require('mongoose')

// A lesson is a small piece of content inside a module.
const resourceSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    url: { type: String, default: '' },
  },
  { _id: false },
)

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Lesson title is required'], trim: true },
    // 'video' lessons must carry a supported YouTube URL; 'text' ones need not.
    type: { type: String, enum: ['video', 'text'], default: 'text' },
    content: { type: String, default: '' },
    videoUrl: { type: String, default: '' }, // optional YouTube URL
    resources: { type: [resourceSchema], default: [] }, // optional labelled links
    duration: { type: String, default: '' }, // e.g. "12 min"
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// A module groups several lessons.
const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Module title is required'], trim: true },
    description: { type: String, default: '' },
    lessons: { type: [lessonSchema], default: [] },
  },
  { timestamps: true },
)

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Course title is required'], trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General', trim: true },
    instructor: { type: String, default: '', trim: true },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    thumbnail: { type: String, default: '' },
    published: { type: Boolean, default: false },
    modules: { type: [moduleSchema], default: [] },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Course', courseSchema)
