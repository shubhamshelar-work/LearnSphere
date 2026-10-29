import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  PlayCircle,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react'
import { courseService } from '../services/courseService'
import CourseCard from '../components/CourseCard'
import LoadingState from '../components/LoadingState'
import ErrorMessage from '../components/ErrorMessage'

const features = [
  {
    icon: <BookOpenCheck className="h-6 w-6 text-primary-500" aria-hidden="true" />,
    title: 'Structured Courses',
    text: 'Every course is organised into modules and short lessons so you always know what to study next.',
  },
  {
    icon: <PlayCircle className="h-6 w-6 text-primary-500" aria-hidden="true" />,
    title: 'Video and Reading Lessons',
    text: 'Learn from embedded video lectures paired with concise notes and curated resource links.',
  },
  {
    icon: <Target className="h-6 w-6 text-primary-500" aria-hidden="true" />,
    title: 'Knowledge Quizzes',
    text: 'Test yourself with timed quizzes and get instant feedback on your score and result.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-primary-500" aria-hidden="true" />,
    title: 'Progress Tracking',
    text: 'Mark lessons complete and watch your course progress fill up as you move toward certification.',
  },
  {
    icon: <Award className="h-6 w-6 text-primary-500" aria-hidden="true" />,
    title: 'Recognised Content',
    text: 'Curated syllabus patterns inspired by leading university and NPTEL-style programmes.',
  },
  {
    icon: <Users className="h-6 w-6 text-primary-500" aria-hidden="true" />,
    title: 'Learn Anywhere',
    text: 'A fully responsive experience that works on desktop, tablet and mobile browsers.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Browse the catalogue',
    text: 'Search and filter courses by category and difficulty to find the right fit.',
  },
  {
    step: '02',
    title: 'Study each lesson',
    text: 'Watch videos, read notes and open resources at your own pace.',
  },
  {
    step: '03',
    title: 'Mark lessons complete',
    text: 'Track module progress and continue exactly where you stopped.',
  },
  {
    step: '04',
    title: 'Take the quiz',
    text: 'Attempt timed quizzes and measure your understanding with instant results.',
  },
]

export default function Home() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadCourses() {
    setLoading(true)
    setError('')
    courseService
      .listCourses()
      .then((result) => setCourses(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const featured = courses.slice(0, 3)

  return (
    <>
      <section className="bg-primary-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-600 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Online learning platform
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              Learn Skills. Test Knowledge.{' '}
              <span className="text-primary-500">Achieve More.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              LearnSphere is a structured online learning platform inspired by NPTEL. Explore
              university-style courses, study module by module, track your progress and prove
              what you have learned with quizzes — all in one clean interface.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
              >
                Explore Courses
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-6 py-3 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
              >
                Start Learning
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80"
              alt="Students learning together"
              className="rounded-3xl border border-primary-100 shadow-lg"
            />
            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-primary-100 bg-white p-4 shadow-md">
              <p className="text-2xl font-bold text-primary-500">3+</p>
              <p className="text-xs font-medium text-muted">Launch courses</p>
            </div>
            <div className="absolute -right-4 top-8 rounded-2xl border border-primary-100 bg-white p-4 shadow-md">
              <p className="text-2xl font-bold text-primary-500">30+</p>
              <p className="text-xs font-medium text-muted">Lessons available</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Featured Courses</h2>
            <p className="mt-2 text-muted">Hand-picked courses to start your learning journey.</p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
          >
            View all courses
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8">
          {loading ? (
            <LoadingState message="Loading courses…" />
          ) : error ? (
            <ErrorMessage message={error} onRetry={loadCourses} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-primary-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">How It Works</h2>
          <p className="mt-2 text-muted">Four simple steps from enrolling to earning results.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm"
              >
                <span className="text-sm font-bold text-primary-500">{item.step}</span>
                <h3 className="mt-3 text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">Platform Features</h2>
        <p className="mt-2 text-muted">Everything you need for a smooth learning experience.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm transition-colors hover:border-primary-200"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                {feature.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-primary-500 px-8 py-10 sm:px-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to start learning?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-primary-100 sm:text-base">
              Create a free account and continue your courses from any device.
            </p>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm transition-colors hover:bg-primary-50"
          >
            Create an account
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  )
}
