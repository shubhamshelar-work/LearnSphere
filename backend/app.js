// app.js
// Builds the Express application (no database connection here so it can be
// imported by tests).

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/authRoutes')
const courseRoutes = require('./routes/courseRoutes')
const quizRoutes = require('./routes/quizRoutes')
const progressRoutes = require('./routes/progressRoutes')
const { notFound, errorHandler } = require('./middleware/errorMiddleware')

const app = express()

// Let React send and receive the auth cookie from another origin.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
)

app.use(express.json())
app.use(cookieParser())

// Health check used to confirm the API is running.
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'LearnSphere API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/progress', progressRoutes)

// 404 + central error handler must be last.
app.use(notFound)
app.use(errorHandler)

module.exports = app
