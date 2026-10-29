// controllers/progressController.js
// Reading a student's progress and marking lessons complete/incomplete.

const Course = require('../models/Course')
const Progress = require('../models/Progress')
const asyncHandler = require('../utils/asyncHandler')
const progressService = require('../services/progressService')

// GET /api/progress/:courseId  (protected)
// Returns a computed progress view (percentages derived from saved data).
const getProgress = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId)
  if (!course) {
    res.status(404)
    throw new Error('Course not found')
  }

  const progress = await Progress.findOne({ userId: req.user._id, courseId: course._id })

  res.json({
    success: true,
    course: {
      _id: course._id,
      title: course.title,
      instructor: course.instructor,
      thumbnail: course.thumbnail,
      category: course.category,
    },
    progress: progressService.buildProgressView(course, progress),
  })
})

// GET /api/progress  (protected)
// All of the student's enrolments with a course summary, for the dashboard.
const getMyProgress = asyncHandler(async (req, res) => {
  const entries = await Progress.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('courseId')

  const enrolments = entries
    .filter((entry) => entry.courseId)
    .map((entry) => ({
      course: {
        _id: entry.courseId._id,
        title: entry.courseId.title,
        instructor: entry.courseId.instructor,
        thumbnail: entry.courseId.thumbnail,
        category: entry.courseId.category,
        difficulty: entry.courseId.difficulty,
      },
      progress: progressService.buildProgressView(entry.courseId, entry),
    }))

  res.json({ success: true, count: enrolments.length, enrolments })
})

// Shared handler for marking a lesson complete or incomplete.
function changeLessonStatus(complete) {
  return asyncHandler(async (req, res) => {
    const { lessonId } = req.params
    const { courseId } = req.body

    if (!courseId) {
      res.status(400)
      throw new Error('courseId is required in the request body')
    }

    const course = await Course.findById(courseId)
    if (!course) {
      res.status(404)
      throw new Error('Course not found')
    }

    const found = progressService.findLesson(course, lessonId)
    if (!found) {
      res.status(404)
      throw new Error('Lesson not found in this course')
    }

    const update = complete
      ? { $addToSet: { completedLessons: lessonId }, $set: { lastAccessedLesson: lessonId } }
      : { $pull: { completedLessons: lessonId }, $set: { lastAccessedLesson: lessonId } }

    await Progress.findOneAndUpdate(
      { userId: req.user._id, courseId: course._id },
      { $setOnInsert: { userId: req.user._id, courseId: course._id }, ...update },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    const progress = await Progress.findOne({ userId: req.user._id, courseId: course._id })

    res.json({
      success: true,
      message: complete ? 'Lesson marked as complete' : 'Lesson marked as incomplete',
      progress: progressService.buildProgressView(course, progress),
    })
  })
}

module.exports = {
  getProgress,
  getMyProgress,
  markLessonComplete: changeLessonStatus(true),
  markLessonIncomplete: changeLessonStatus(false),
}
