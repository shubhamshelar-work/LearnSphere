import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Trash2,
  Video,
} from 'lucide-react'
import { courseService } from '../services/courseService'
import { quizService } from '../services/quizService'
import LoadingState from '../components/LoadingState'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'

const uid = () => Math.random().toString(36).slice(2, 9)

const inputClasses =
  'w-full rounded-lg border border-primary-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-100'

const CATEGORIES = ['Web Development', 'Databases', 'Artificial Intelligence', 'General']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

function buildLesson() {
  return { key: uid(), title: '', type: 'text', videoUrl: '', content: '', duration: '' }
}

function buildModule(index) {
  return {
    key: uid(),
    _id: null,
    title: `Module ${index + 1}`,
    description: '',
    lessons: [buildLesson()],
  }
}

function buildEmptyCourse() {
  return {
    _id: null,
    title: '',
    description: '',
    category: 'Web Development',
    instructor: '',
    difficulty: 'Beginner',
    thumbnail: '',
    published: false,
    modules: [buildModule(0)],
  }
}

function toCourseForm(course) {
  return {
    ...course,
    modules: (course.modules || []).map((module, index) => ({
      ...module,
      key: module._id || `module-${index}-${uid()}`,
      description: module.description || '',
      lessons: (module.lessons || []).map((lesson) => ({
        ...lesson,
        key: lesson._id || uid(),
      })),
    })),
  }
}

function toCoursePayload(form) {
  return {
    title: form.title,
    description: form.description,
    category: form.category,
    instructor: form.instructor,
    difficulty: form.difficulty,
    thumbnail: form.thumbnail,
    published: form.published,
    modules: form.modules.map((module) => ({
      title: module.title,
      description: module.description,
      lessons: module.lessons.map((lesson, lessonIndex) => ({
        title: lesson.title,
        type: lesson.videoUrl ? 'video' : lesson.type,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        order: lessonIndex,
      })),
    })),
  }
}

function buildEmptyQuiz(moduleId, moduleTitle) {
  return {
    _id: null,
    moduleId,
    moduleTitle,
    title: `${moduleTitle} Quiz`,
    description: '',
    timeLimit: 10,
    passingPercentage: 60,
    attemptLimit: 0,
    shuffleQuestions: false,
    shuffleOptions: false,
    showExplanations: true,
    published: false,
    questions: [buildQuestion()],
  }
}

function buildQuestion() {
  return {
    key: uid(),
    questionText: '',
    options: [
      { id: 'a', label: '' },
      { id: 'b', label: '' },
      { id: 'c', label: '' },
      { id: 'd', label: '' },
    ],
    correctOptionId: 'a',
    marks: 1,
    explanation: '',
  }
}

function toQuizPayload(quiz, courseId) {
  return {
    courseId,
    moduleId: quiz.moduleId,
    title: quiz.title,
    description: quiz.description,
    timeLimit: Number(quiz.timeLimit) || 1,
    passingPercentage: Number(quiz.passingPercentage) || 0,
    attemptLimit: Number(quiz.attemptLimit) || 0,
    shuffleQuestions: Boolean(quiz.shuffleQuestions),
    shuffleOptions: Boolean(quiz.shuffleOptions),
    showExplanations: Boolean(quiz.showExplanations),
    published: Boolean(quiz.published),
    questions: quiz.questions.map((question) => ({
      questionText: question.questionText,
      options: question.options.map((option) => ({ id: option.id, label: option.label })),
      correctOptionId: question.correctOptionId,
      marks: Number(question.marks) || 1,
      explanation: question.explanation,
    })),
  }
}

export default function AdminDashboard() {
  const [mode, setMode] = useState('list') // list | edit | quiz
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(buildEmptyCourse)
  const [expanded, setExpanded] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const [quiz, setQuiz] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizSaving, setQuizSaving] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [quizMessage, setQuizMessage] = useState('')

  function loadCourses() {
    setLoading(true)
    setError('')
    courseService
      .listAllCourses()
      .then((result) => setCourses(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCourses()
  }, [])

  // ---- Course CRUD ----
  function startNewCourse() {
    const empty = buildEmptyCourse()
    setForm(empty)
    setExpanded(empty.modules.map((module) => module.key))
    setMessage('')
    setFormError('')
    setMode('edit')
  }

  function startEditCourse(course) {
    const prepared = toCourseForm(course)
    setForm(prepared)
    setExpanded(prepared.modules.map((module) => module.key))
    setMessage('')
    setFormError('')
    setMode('edit')
  }

  function updateForm(updater) {
    setForm((prev) => updater(structuredClone(prev)))
    setMessage('')
  }

  function addModule() {
    updateForm((next) => {
      next.modules.push(buildModule(next.modules.length))
      return next
    })
  }

  function removeModule(index) {
    updateForm((next) => {
      next.modules.splice(index, 1)
      return next
    })
  }

  function addLesson(moduleIndex) {
    updateForm((next) => {
      next.modules[moduleIndex].lessons.push(buildLesson())
      return next
    })
  }

  function removeLesson(moduleIndex, lessonIndex) {
    updateForm((next) => {
      next.modules[moduleIndex].lessons.splice(lessonIndex, 1)
      return next
    })
  }

  function updateLesson(moduleIndex, lessonIndex, patch) {
    updateForm((next) => {
      Object.assign(next.modules[moduleIndex].lessons[lessonIndex], patch)
      return next
    })
  }

  async function handleSaveCourse() {
    setFormError('')
    setMessage('')

    if (!form.title.trim()) {
      setFormError('Course title is required.')
      return
    }
    const invalidVideo = form.modules.some((module) =>
      module.lessons.some((lesson) => lesson.type === 'video' && !lesson.videoUrl.trim()),
    )
    if (invalidVideo) {
      setFormError('Every video lesson needs a YouTube URL.')
      return
    }

    setSaving(true)
    try {
      const payload = toCoursePayload(form)
      const saved = form._id
        ? await courseService.updateCourse(form._id, payload)
        : await courseService.createCourse(payload)
      setForm(toCourseForm(saved))
      setMessage(form._id ? 'Course updated.' : 'Course created. You can now add module quizzes.')
      loadCourses()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCourse(course) {
    if (!window.confirm(`Delete "${course.title}" and all of its quizzes and progress?`)) return
    try {
      await courseService.deleteCourse(course._id)
      loadCourses()
    } catch (err) {
      setError(err.message)
    }
  }

  // ---- Quiz CRUD ----
  async function openQuiz(module) {
    setQuizError('')
    setQuizMessage('')
    setQuizLoading(true)
    setMode('quiz')
    try {
      const existing = await quizService.getQuizForModuleAdmin(form._id, module._id)
      if (existing) {
        setQuiz({
          ...existing,
          moduleTitle: module.title,
          questions: existing.questions.map((question) => ({ ...question, key: uid() })),
        })
      } else {
        setQuiz(buildEmptyQuiz(module._id, module.title))
      }
    } catch (err) {
      setQuizError(err.message)
      setQuiz(buildEmptyQuiz(module._id, module.title))
    } finally {
      setQuizLoading(false)
    }
  }

  function updateQuiz(updater) {
    setQuiz((prev) => updater(structuredClone(prev)))
    setQuizMessage('')
  }

  function addQuestion() {
    updateQuiz((next) => {
      next.questions.push(buildQuestion())
      return next
    })
  }

  function removeQuestion(index) {
    updateQuiz((next) => {
      if (next.questions.length > 1) next.questions.splice(index, 1)
      return next
    })
  }

  async function handleSaveQuiz() {
    setQuizError('')
    setQuizMessage('')

    if (!quiz.title.trim()) {
      setQuizError('Quiz title is required.')
      return
    }
    const invalid = quiz.questions.some(
      (question) =>
        !question.questionText.trim() ||
        question.options.length < 2 ||
        question.options.some((option) => !option.label.trim()),
    )
    if (invalid) {
      setQuizError('Every question needs text and a label for each option.')
      return
    }

    setQuizSaving(true)
    try {
      const payload = toQuizPayload(quiz, form._id)
      const saved = quiz._id
        ? await quizService.updateQuiz(quiz._id, payload)
        : await quizService.createQuiz(payload)
      setQuiz({
        ...saved,
        moduleTitle: quiz.moduleTitle,
        questions: saved.questions.map((question) => ({ ...question, key: uid() })),
      })
      setQuizMessage(quiz._id ? 'Quiz updated.' : 'Quiz created.')
    } catch (err) {
      setQuizError(err.message)
    } finally {
      setQuizSaving(false)
    }
  }

  async function handleDeleteQuiz() {
    if (!quiz._id) return
    if (!window.confirm('Delete this module quiz?')) return
    try {
      await quizService.deleteQuiz(quiz._id)
      setQuiz(buildEmptyQuiz(quiz.moduleId, quiz.moduleTitle))
      setQuizMessage('Quiz deleted.')
    } catch (err) {
      setQuizError(err.message)
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <LoadingState message="Loading admin data…" />
      </section>
    )
  }

  // ---------------- Quiz builder ----------------
  if (mode === 'quiz' && quiz) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to course
        </button>

        <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
          {quiz._id ? 'Edit' : 'New'} quiz — {quiz.moduleTitle}
        </h1>

        {quizLoading ? (
          <LoadingState message="Loading quiz…" />
        ) : (
          <div className="mt-6 space-y-6">
            {quizError && <ErrorMessage message={quizError} />}
            {quizMessage && (
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                {quizMessage}
              </p>
            )}

            <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-ink">Quiz settings</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="mb-1.5 block text-sm font-medium text-ink">Quiz title</label>
                  <input
                    type="text"
                    value={quiz.title}
                    onChange={(event) =>
                      updateQuiz((next) => {
                        next.title = event.target.value
                        return next
                      })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Time limit (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quiz.timeLimit}
                    onChange={(event) =>
                      updateQuiz((next) => {
                        next.timeLimit = event.target.value
                        return next
                      })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Pass percentage
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={quiz.passingPercentage}
                    onChange={(event) =>
                      updateQuiz((next) => {
                        next.passingPercentage = event.target.value
                        return next
                      })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Attempt limit (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quiz.attemptLimit}
                    onChange={(event) =>
                      updateQuiz((next) => {
                        next.attemptLimit = event.target.value
                        return next
                      })
                    }
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                {[
                  ['shuffleQuestions', 'Shuffle questions'],
                  ['shuffleOptions', 'Shuffle options'],
                  ['showExplanations', 'Show explanations after grading'],
                  ['published', 'Published'],
                ].map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={Boolean(quiz[field])}
                      onChange={(event) =>
                        updateQuiz((next) => {
                          next[field] = event.target.checked
                          return next
                        })
                      }
                      className="h-4 w-4 accent-primary-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink">Questions</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Question
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {quiz.questions.map((question, questionIndex) => (
                  <div key={question.key} className="rounded-xl border border-primary-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Question {questionIndex + 1}
                      </p>
                      {quiz.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remove
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Enter the question text…"
                      value={question.questionText}
                      onChange={(event) =>
                        updateQuiz((next) => {
                          next.questions[questionIndex].questionText = event.target.value
                          return next
                        })
                      }
                      className={`mt-3 ${inputClasses}`}
                    />

                    <p className="mt-3 text-sm font-medium text-ink">
                      Options — select the correct answer
                    </p>
                    <div className="mt-2 space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${question.key}`}
                            checked={question.correctOptionId === option.id}
                            onChange={() =>
                              updateQuiz((next) => {
                                next.questions[questionIndex].correctOptionId = option.id
                                return next
                              })
                            }
                            className="h-4 w-4 shrink-0 accent-primary-500"
                          />
                          <input
                            type="text"
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option.label}
                            onChange={(event) =>
                              updateQuiz((next) => {
                                next.questions[questionIndex].options[optionIndex].label =
                                  event.target.value
                                return next
                              })
                            }
                            className={inputClasses}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-3">
                      <label className="mb-1.5 block text-sm font-medium text-ink">
                        Explanation (optional)
                      </label>
                      <input
                        type="text"
                        value={question.explanation}
                        onChange={(event) =>
                          updateQuiz((next) => {
                            next.questions[questionIndex].explanation = event.target.value
                            return next
                          })
                        }
                        className={inputClasses}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveQuiz}
                disabled={quizSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {quizSaving ? 'Saving…' : 'Save Quiz'}
              </button>
              {quiz._id && (
                <button
                  type="button"
                  onClick={handleDeleteQuiz}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    )
  }

  // ---------------- Course editor ----------------
  if (mode === 'edit' && form) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <button
          type="button"
          onClick={() => setMode('list')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to courses
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            {form._id ? 'Edit course' : 'New course'}
          </h1>
          <button
            type="button"
            onClick={handleSaveCourse}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Save Course'}
          </button>
        </div>

        {formError && (
          <div className="mt-4">
            <ErrorMessage message={formError} />
          </div>
        )}
        {message && (
          <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {message}
          </p>
        )}
        {!form._id && (
          <p className="mt-4 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
            Save the course first to unlock module quiz management.
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <BookOpen className="h-5 w-5 text-primary-500" aria-hidden="true" />
            Course Details
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-ink">Course title</label>
              <input
                type="text"
                placeholder="e.g. Full Stack Web Development"
                value={form.title}
                onChange={(event) =>
                  updateForm((next) => {
                    next.title = event.target.value
                    return next
                  })
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Instructor</label>
              <input
                type="text"
                placeholder="e.g. Dr. Anita Sharma"
                value={form.instructor}
                onChange={(event) =>
                  updateForm((next) => {
                    next.instructor = event.target.value
                    return next
                  })
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
              <select
                value={form.category}
                onChange={(event) =>
                  updateForm((next) => {
                    next.category = event.target.value
                    return next
                  })
                }
                className={inputClasses}
              >
                {CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(event) =>
                  updateForm((next) => {
                    next.difficulty = event.target.value
                    return next
                  })
                }
                className={inputClasses}
              >
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Thumbnail URL</label>
              <input
                type="url"
                placeholder="https://…"
                value={form.thumbnail}
                onChange={(event) =>
                  updateForm((next) => {
                    next.thumbnail = event.target.value
                    return next
                  })
                }
                className={inputClasses}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
              <textarea
                rows={3}
                placeholder="Detailed course description"
                value={form.description}
                onChange={(event) =>
                  updateForm((next) => {
                    next.description = event.target.value
                    return next
                  })
                }
                className={inputClasses}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Publishing status</p>
              <p className="text-xs text-muted">
                {form.published
                  ? 'This course is visible to students.'
                  : 'This course is a draft and hidden from students.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateForm((next) => {
                  next.published = !next.published
                  return next
                })
              }
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                form.published
                  ? 'bg-green-100 text-green-700'
                  : 'border border-primary-200 bg-white text-muted'
              }`}
            >
              {form.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {form.published ? 'Published' : 'Draft'}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Modules &amp; Lessons</h2>
            <button
              type="button"
              onClick={addModule}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Module
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {form.modules.map((module, moduleIndex) => {
              const isExpanded = expanded.includes(module.key)
              return (
                <div key={module.key} className="overflow-hidden rounded-xl border border-primary-100">
                  <div className="flex items-center gap-2 bg-primary-50 px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((ids) =>
                          ids.includes(module.key)
                            ? ids.filter((id) => id !== module.key)
                            : [...ids, module.key],
                        )
                      }
                      aria-expanded={isExpanded}
                      className="text-primary-600"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <input
                      type="text"
                      value={module.title}
                      onChange={(event) =>
                        updateForm((next) => {
                          next.modules[moduleIndex].title = event.target.value
                          return next
                        })
                      }
                      aria-label={`Module ${moduleIndex + 1} title`}
                      className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-ink outline-none hover:border-primary-200 focus:border-primary-500 focus:bg-white"
                    />
                    <span className="text-xs text-muted">{module.lessons.length} lessons</span>
                    {form.modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeModule(moduleIndex)}
                        className="text-red-600 hover:underline"
                        aria-label="Remove module"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 p-4">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.key} className="rounded-xl border border-primary-100 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                              Lesson {lessonIndex + 1}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeLesson(moduleIndex, lessonIndex)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Remove
                            </button>
                          </div>

                          <div className="mt-3 grid gap-3">
                            <input
                              type="text"
                              placeholder="Lesson title"
                              value={lesson.title}
                              onChange={(event) =>
                                updateLesson(moduleIndex, lessonIndex, { title: event.target.value })
                              }
                              className={inputClasses}
                            />
                            <div className="grid gap-3 sm:grid-cols-3">
                              <select
                                value={lesson.type}
                                onChange={(event) =>
                                  updateLesson(moduleIndex, lessonIndex, { type: event.target.value })
                                }
                                className={inputClasses}
                              >
                                <option value="video">Video lesson</option>
                                <option value="text">Reading lesson</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Duration e.g. 12 min"
                                value={lesson.duration}
                                onChange={(event) =>
                                  updateLesson(moduleIndex, lessonIndex, { duration: event.target.value })
                                }
                                className={`sm:col-span-2 ${inputClasses}`}
                              />
                            </div>

                            {lesson.type === 'video' && (
                              <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                                  <Video className="h-4 w-4 text-primary-500" aria-hidden="true" />
                                  Video URL (YouTube)
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://www.youtube.com/watch?v=…"
                                  value={lesson.videoUrl}
                                  onChange={(event) =>
                                    updateLesson(moduleIndex, lessonIndex, { videoUrl: event.target.value })
                                  }
                                  className={inputClasses}
                                />
                              </div>
                            )}

                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-ink">
                                Lesson content (notes)
                              </label>
                              <textarea
                                rows={3}
                                placeholder="Write the lesson notes students will read…"
                                value={lesson.content}
                                onChange={(event) =>
                                  updateLesson(moduleIndex, lessonIndex, { content: event.target.value })
                                }
                                className={inputClasses}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addLesson(moduleIndex)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add Lesson
                      </button>

                      {form._id && module._id && (
                        <button
                          type="button"
                          onClick={() => openQuiz(module)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
                        >
                          <Award className="h-4 w-4" aria-hidden="true" />
                          Manage Module Quiz
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  // ---------------- Course list ----------------
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Create and edit courses, manage modules and lessons, and build module quizzes.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewCourse}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Course
        </button>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorMessage message={error} onRetry={loadCourses} />
        </div>
      )}

      {courses.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No courses yet"
            message="Create your first course to get started."
            action={
              <button
                type="button"
                onClick={startNewCourse}
                className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
              >
                New Course
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary-100 bg-primary-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Modules</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {courses.map((course) => (
                <tr key={course._id}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{course.title}</p>
                    <p className="text-xs text-muted">{course.category}</p>
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {course.modules.length} · {course.lessonCount} lessons
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        course.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {course.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => startEditCourse(course)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(course)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
