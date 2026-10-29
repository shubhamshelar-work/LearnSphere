// seed/seedData.js
// Deletes the existing courses, quizzes and attempts, then inserts sample data.
// Run with: npm run seed
//
// At least one admin must exist to manage content from the frontend:
//   npm run seed:admin -- "Admin Name" admin@example.com secret123

require('dotenv').config()

const connectDB = require('../config/db')
const Course = require('../models/Course')
const Quiz = require('../models/Quiz')
const QuizAttempt = require('../models/QuizAttempt')
const { disconnectDB } = require('./dbHelpers')

const courses = [
  {
    title: 'JavaScript Fundamentals',
    description:
      'Learn the building blocks of JavaScript: variables, functions, arrays, objects and the DOM.',
    category: 'Web Development',
    instructor: 'Priya Sharma',
    difficulty: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
    published: true,
    modules: [
      {
        title: 'Getting Started',
        description: 'Set up your environment and write your first lines of code.',
        lessons: [
          {
            title: 'What is JavaScript?',
            type: 'video',
            content: 'JavaScript is the language of the web. It runs in every browser.',
            videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
            duration: '10 min',
            order: 1,
          },
          {
            title: 'Variables and Data Types',
            type: 'video',
            content: 'Use let and const to store values: strings, numbers and booleans.',
            videoUrl: 'https://www.youtube.com/watch?v=9WIWzu_tRB0',
            duration: '14 min',
            order: 2,
          },
        ],
      },
      {
        title: 'Control Flow',
        description: 'Make decisions and repeat work with conditions and loops.',
        lessons: [
          {
            title: 'If / Else',
            type: 'text',
            content: 'Run different code depending on a condition.',
            duration: '11 min',
            order: 1,
          },
          {
            title: 'Loops',
            type: 'text',
            content: 'for and while loops let you repeat blocks of code.',
            duration: '13 min',
            order: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'React for Beginners',
    description:
      'Build modern user interfaces with components, props, state and hooks using React.',
    category: 'Web Development',
    instructor: 'Arjun Mehta',
    difficulty: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    published: true,
    modules: [
      {
        title: 'React Basics',
        description: 'Understand components and JSX.',
        lessons: [
          {
            title: 'Your First Component',
            type: 'video',
            content: 'A component is a reusable piece of UI written as a function.',
            videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
            duration: '12 min',
            order: 1,
          },
          {
            title: 'Props and State',
            type: 'text',
            content: 'Props pass data in, state tracks changes over time.',
            duration: '16 min',
            order: 2,
          },
        ],
      },
      {
        title: 'Hooks in Practice',
        description: 'useState, useEffect and friends.',
        lessons: [
          {
            title: 'The useState Hook',
            type: 'video',
            content: 'useState adds local state to a function component.',
            videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
            duration: '14 min',
            order: 1,
          },
          {
            title: 'The useEffect Hook',
            type: 'text',
            content: 'useEffect runs side effects after render.',
            duration: '15 min',
            order: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'SQL and Databases',
    description: 'Learn how relational databases work and how to query them with SQL.',
    category: 'Databases',
    instructor: 'Neha Verma',
    difficulty: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    published: true,
    modules: [
      {
        title: 'The Basics of SQL',
        description: 'Tables, rows and columns.',
        lessons: [
          {
            title: 'SELECT Statements',
            type: 'text',
            content: 'SELECT reads data from a table.',
            duration: '9 min',
            order: 1,
          },
          {
            title: 'Filtering with WHERE',
            type: 'video',
            content: 'WHERE narrows down which rows you get back.',
            videoUrl: 'https://www.youtube.com/watch?v=zsjvFFKOm3c',
            duration: '10 min',
            order: 2,
          },
        ],
      },
    ],
  },
]

// Question banks keyed by course title. Each module gets a quiz built from the
// matching bank (cycled if a module needs more questions than the bank has).
const questionBanks = {
  'JavaScript Fundamentals': [
    {
      questionText: 'Which keyword declares a variable that cannot be reassigned?',
      options: [
        { id: 'a', label: 'var' },
        { id: 'b', label: 'let' },
        { id: 'c', label: 'const' },
        { id: 'd', label: 'static' },
      ],
      correctOptionId: 'c',
      explanation: 'const creates a binding that cannot be reassigned.',
    },
    {
      questionText: 'What is the result of typeof "hello"?',
      options: [
        { id: 'a', label: '"string"' },
        { id: 'b', label: '"text"' },
        { id: 'c', label: '"char"' },
        { id: 'd', label: '"word"' },
      ],
      correctOptionId: 'a',
      explanation: 'Text values have the type "string".',
    },
    {
      questionText: 'Which loop runs at least once even if the condition is false?',
      options: [
        { id: 'a', label: 'for' },
        { id: 'b', label: 'while' },
        { id: 'c', label: 'do...while' },
        { id: 'd', label: 'forEach' },
      ],
      correctOptionId: 'c',
      explanation: 'A do...while loop checks its condition after running the body.',
    },
    {
      questionText: 'Which value is falsy in JavaScript?',
      options: [
        { id: 'a', label: '0' },
        { id: 'b', label: '"0"' },
        { id: 'c', label: '[]' },
        { id: 'd', label: '{}' },
      ],
      correctOptionId: 'a',
      explanation: '0, "", null, undefined and NaN are falsy.',
    },
  ],
  'React for Beginners': [
    {
      questionText: 'What is a React component?',
      options: [
        { id: 'a', label: 'A CSS class' },
        { id: 'b', label: 'A reusable piece of UI' },
        { id: 'c', label: 'A database table' },
        { id: 'd', label: 'A server' },
      ],
      correctOptionId: 'b',
      explanation: 'Components describe reusable parts of the user interface.',
    },
    {
      questionText: 'Which hook stores data that changes over time?',
      options: [
        { id: 'a', label: 'useState' },
        { id: 'b', label: 'useRef' },
        { id: 'c', label: 'useMemo' },
        { id: 'd', label: 'useContext' },
      ],
      correctOptionId: 'a',
      explanation: 'useState returns a value and a function to update it.',
    },
    {
      questionText: 'How do you pass data into a component?',
      options: [
        { id: 'a', label: 'Using props' },
        { id: 'b', label: 'Using a database' },
        { id: 'c', label: 'Using CSS' },
        { id: 'd', label: 'Using a file' },
      ],
      correctOptionId: 'a',
      explanation: 'Props are read-only inputs passed from parent to child.',
    },
    {
      questionText: 'When does useEffect run by default?',
      options: [
        { id: 'a', label: 'Only during render' },
        { id: 'b', label: 'After every render' },
        { id: 'c', label: 'Never' },
        { id: 'd', label: 'Only on the server' },
      ],
      correctOptionId: 'b',
      explanation: 'Without a dependency array, useEffect runs after every render.',
    },
  ],
  'SQL and Databases': [
    {
      questionText: 'Which SQL statement reads data from a table?',
      options: [
        { id: 'a', label: 'INSERT' },
        { id: 'b', label: 'SELECT' },
        { id: 'c', label: 'DELETE' },
        { id: 'd', label: 'UPDATE' },
      ],
      correctOptionId: 'b',
      explanation: 'SELECT retrieves rows from one or more tables.',
    },
    {
      questionText: 'Which clause filters rows?',
      options: [
        { id: 'a', label: 'ORDER BY' },
        { id: 'b', label: 'GROUP BY' },
        { id: 'c', label: 'WHERE' },
        { id: 'd', label: 'LIMIT' },
      ],
      correctOptionId: 'c',
      explanation: 'WHERE keeps only the rows that match a condition.',
    },
    {
      questionText: 'Which keyword removes duplicate rows from a result?',
      options: [
        { id: 'a', label: 'DISTINCT' },
        { id: 'b', label: 'UNIQUE' },
        { id: 'c', label: 'ONLY' },
        { id: 'd', label: 'FILTER' },
      ],
      correctOptionId: 'a',
      explanation: 'SELECT DISTINCT returns only unique rows.',
    },
  ],
}

function buildQuizQuestions(bank, count) {
  return bank.slice(0, count).map((question) => ({ ...question, marks: 1 }))
}

async function run() {
  await connectDB()

  await Promise.all([Course.deleteMany({}), Quiz.deleteMany({}), QuizAttempt.deleteMany({})])
  console.log('Cleared existing courses, quizzes and attempts.')

  for (const courseData of courses) {
    const course = await Course.create(courseData)
    console.log(`Inserted course: ${course.title}`)

    const bank = questionBanks[course.title] || []

    for (let index = 0; index < course.modules.length; index += 1) {
      const module = course.modules[index]
      const questionCount = Math.min(bank.length, index === 0 ? 3 : 2)
      const questions = buildQuizQuestions(bank, questionCount || bank.length)

      await Quiz.create({
        courseId: course._id,
        moduleId: module._id,
        title: `${module.title} Quiz`,
        description: `Check your understanding of "${module.title}".`,
        timeLimit: 10,
        passingPercentage: 60,
        attemptLimit: 3,
        shuffleQuestions: true,
        shuffleOptions: true,
        showExplanations: true,
        published: true,
        questions,
      })
      console.log(`  Added quiz for module: ${module.title}`)
    }
  }

  console.log('Seed complete. Remember to create an admin: npm run seed:admin')
  await disconnectDB()
  process.exit(0)
}

run().catch(async (error) => {
  console.error(`Seed failed: ${error.message}`)
  await disconnectDB()
  process.exit(1)
})
