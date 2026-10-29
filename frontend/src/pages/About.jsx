import { Link } from 'react-router-dom'
import { BookOpen, Compass, Goal, Users } from 'lucide-react'

const values = [
  {
    icon: <BookOpen className="h-6 w-6 text-primary-500" aria-hidden="true" />,
    title: 'Structured content',
    text: 'Every course follows a clear syllabus of modules and short lessons, inspired by university programmes.',
  },
  {
    icon: <Goal className="h-6 w-6 text-primary-500" aria-hidden="true" />,
    title: 'Assessment first',
    text: 'Quizzes are built into every course so learners can continuously measure their understanding.',
  },
  {
    icon: <Users className="h-6 w-6 text-primary-500" aria-hidden="true" />,
    title: 'Accessible to all',
    text: 'A clean, responsive interface that works for students on phones, tablets and desktops.',
  },
]

export default function About() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">About LearnSphere</h1>
        <p className="mt-4 leading-relaxed text-muted">
          LearnSphere is an online learning platform inspired by NPTEL and modern MOOC
          providers. Our goal is to give students a structured place to learn technical
          subjects — with video lessons, readable notes, curated resources and quizzes that
          reinforce every module.
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          This release is a complete frontend prototype built with React, Vite and Tailwind
          CSS. All course content is sample data; the backend API will be integrated in a
          later phase.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {values.map((value) => (
          <div
            key={value.title}
            className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
              {value.icon}
            </span>
            <h2 className="mt-4 text-base font-semibold text-ink">{value.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-primary-50 px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Explore what is on offer</h2>
            <p className="mt-1 text-sm text-muted">
              Three launch courses covering web development, databases and AI.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              <Compass className="mr-1.5 inline h-4 w-4" aria-hidden="true" />
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
