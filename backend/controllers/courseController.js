// controllers/courseController.js
// Course CRUD (admin), public listing, and student enrollment.
// Input is validated here; reusable lookups live in services/progressService.

const Course = require('../models/Course')
const Quiz = require('../models/Quiz')
const QuizAttempt = require('../models/QuizAttempt')
const Progress = require('../models/Progress')
const asyncHandler = require('../utils/asyncHandler')
const { isNonEmptyString, isSupportedYouTubeUrl } = require('../utils/validate')

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

// Validate and normalise modules/lessons coming from an admin.
function sanitizeModules(rawModules) {
  if (rawModules === undefined) return undefined
  if (!Array.isArray(rawModules)) {
    throw Object.assign(new Error('modules must be an array'), { statusCode: 400 })
  }

  return rawModules.map((module, moduleIndex) => {
    const moduleLabel = `Module ${moduleIndex + 1}`
    if (!isNonEmptyString(module.title)) {
      throw Object.assign(new Error(`${moduleLabel}: title is required`), { statusCode: 400 })
    }

    const lessons = Array.isArray(module.lessons) ? module.lessons : []
    const sanitizedLessons = lessons.map((lesson, lessonIndex) => {
      const lessonLabel = `${moduleLabel}, lesson ${lessonIndex + 1}`
      if (!isNonEmptyString(lesson.title)) {
        throw Object.assign(new Error(`${lessonLabel}: title is required`), { statusCode: 400 })
      }

      const videoUrl = isNonEmptyString(lesson.videoUrl) ? lesson.videoUrl.trim() : ''
      if (videoUrl && !isSupportedYouTubeUrl(videoUrl)) {
        throw Object.assign(
          new Error(`${lessonLabel}: "${videoUrl}" is not a supported YouTube URL`),
          { statusCode: 400 },
        )
      }

      const type = videoUrl ? 'video' : lesson.type === 'video' ? 'video' : 'text'
      if (type === 'video' && !videoUrl) {
        throw Object.assign(
          new Error(`${lessonLabel}: a video lesson needs a YouTube URL`),
          { statusCode: 400 },
        )
      }

      const resources = Array.isArray(lesson.resources)
        ? lesson.resources
            .filter((resource) => isNonEmptyString(resource?.label) || isNonEmptyString(resource?.url))
            .map((resource) => ({
              label: isNonEmptyString(resource.label) ? resource.label.trim() : '',
              url: isNonEmptyString(resource.url) ? resource.url.trim() : '',
            }))
        : []

      return {
        title: lesson.title.trim(),
        type,
        content: typeof lesson.content === 'string' ? lesson.content : '',
        videoUrl,
        resources,
        duration: isNonEmptyString(lesson.duration) ? lesson.duration.trim() : '',
        order: Number.isFinite(Number(lesson.order)) ? Number(lesson.order) : lessonIndex,
      }
    })

    return {
      title: module.title.trim(),
      description: isNonEmptyString(module.description) ? module.description.trim() : '',
      lessons: sanitizedLessons,
    }
  })
}

function sanitizeCoursePayload(body, { partial = false } = {}) {
  const payload = {}

  if (body.title !== undefined || !partial) {
    if (!isNonEmptyString(body.title)) {
      throw Object.assign(new Error('Course title is required'), { statusCode: 400 })
    }
    payload.title = body.title.trim()
  }

  if (body.description !== undefined) payload.description = String(body.description)
  if (body.category !== undefined) {
    payload.category = isNonEmptyString(body.category) ? body.category.trim() : 'General'
  }
  if (body.instructor !== undefined) {
    payload.instructor = isNonEmptyString(body.instructor) ? body.instructor.trim() : ''
  }
  if (body.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(body.difficulty)) {
      throw Object.assign(new Error('Invalid difficulty value'), { statusCode: 400 })
    }
    payload.difficulty = body.difficulty
  }
  if (body.thumbnail !== undefined) payload.thumbnail = String(body.thumbnail)
  if (body.published !== undefined) payload.published = Boolean(body.published)

  const modules = sanitizeModules(body.modules)
  if (modules !== undefined) payload.modules = modules

  return payload
}

// GET /api/courses  (public) — published only.
const getCourses = asyncHandler(async (req, res) => {
  const { search, category, difficulty } = req.query
  const filter = { published: true }

  if (search) filter.title = { $regex: String(search), $options: 'i' }
  if (category) filter.category = category
  if (difficulty) filter.difficulty = difficulty

  const courses = await Course.find(filter).sort({ createdAt: -1 })
  res.json({ success: true, count: courses.length, courses })
})

// GET /api/courses/admin/all  (admin) — every course, published or not.
const getCoursesForAdmin = asyncHandler(async (req, res) => {
  const courses = await Course.find({}).sort({ createdAt: -1 })
  res.json({ success: true, count: courses.length, courses })
})

// GET /api/courses/:id  (public)
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
  if (!course) {
    res.status(404)
    throw new Error('Course not found')
  }
  res.json({ success: true, course })
})

// POST /api/courses  (admin)
const createCourse = asyncHandler(async (req, res) => {
  const payload = sanitizeCoursePayload(req.body)
  const course = await Course.create(payload)
  res.status(201).json({ success: true, message: 'Course created', course })
})

// PUT /api/courses/:id  (admin)
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
  if (!course) {
    res.status(404)
    throw new Error('Course not found')
  }

  const payload = sanitizeCoursePayload(req.body, { partial: true })
  Object.assign(course, payload)
  await course.save()

  res.json({ success: true, message: 'Course updated', course })
})

// DELETE /api/courses/:id  (admin) — also removes the course's quizzes,
// attempts and progress so no orphaned data is left behind.
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
  if (!course) {
    res.status(404)
    throw new Error('Course not found')
  }

  await Promise.all([
    Quiz.deleteMany({ courseId: course._id }),
    QuizAttempt.deleteMany({ courseId: course._id }),
    Progress.deleteMany({ courseId: course._id }),
    course.deleteOne(),
  ])

  res.json({ success: true, message: 'Course deleted' })
})

// POST /api/courses/:courseId/enroll  (protected)
const enrollInCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId)
  if (!course) {
    res.status(404)
    throw new Error('Course not found')
  }
  if (!course.published) {
    res.status(403)
    throw new Error('This course is not open for enrollment yet')
  }

  const progress = await Progress.findOneAndUpdate(
    { userId: req.user._id, courseId: course._id },
    {
      $setOnInsert: {
        userId: req.user._id,
        courseId: course._id,
        completedLessons: [],
        quizAttempts: [],
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )

  res.status(201).json({ success: true, message: `Enrolled in ${course.title}`, progress })
})

module.exports = {
  getCourses,
  getCoursesForAdmin,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
}
