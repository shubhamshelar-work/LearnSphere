// services/progressService.js
// Course/lesson lookups and progress computation. Kept separate so both the
// course and progress controllers can reuse it.

const Progress = require('../models/Progress')

// Find a lesson (and its module) inside a course by lesson id.
function findLesson(course, lessonId) {
  for (const module of course.modules || []) {
    for (const lesson of module.lessons || []) {
      if (lesson._id.toString() === String(lessonId)) {
        return { module, lesson }
      }
    }
  }
  return null
}

function countLessons(course) {
  return (course.modules || []).reduce(
    (total, module) => total + (module.lessons || []).length,
    0,
  )
}

// A plain, frontend-friendly view of a student's progress in a course.
function buildProgressView(course, progress) {
  const totalLessons = countLessons(course)
  const completedLessonIds = (progress?.completedLessons || []).map((id) => id.toString())
  const completedLessons = completedLessonIds.length
  const percent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return {
    courseId: course._id,
    totalLessons,
    completedLessons,
    percent,
    completedLessonIds,
    lastAccessedLesson: progress?.lastAccessedLesson
      ? progress.lastAccessedLesson.toString()
      : null,
    enrolled: Boolean(progress?._id),
  }
}

// Get a student's progress document, creating an enrolment if it does not exist.
async function getOrCreateProgress(userId, courseId) {
  return Progress.findOneAndUpdate(
    { userId, courseId },
    { $setOnInsert: { userId, courseId, completedLessons: [], quizAttempts: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
}

module.exports = { findLesson, countLessons, buildProgressView, getOrCreateProgress }
