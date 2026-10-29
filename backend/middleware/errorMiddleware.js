// middleware/errorMiddleware.js
// Two helpers: one for unknown routes, one for turning errors into JSON replies.

// Runs when no route matched the request.
function notFound(req, res, next) {
  res.status(404)
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`))
}

// Central error handler. Express recognizes it because it takes four arguments.
function errorHandler(err, req, res, next) {
  // Prefer an explicit status attached to the error, then any status the
  // controller already set, and finally fall back to 500.
  let statusCode =
    err.statusCode ||
    err.status ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500)
  let message = err.message || 'Server error'

  // Mongoose: bad ObjectId (for example /api/courses/abc)
  if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid id format'
  }

  // MongoDB: duplicate value for a unique field (for example a repeated email)
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `Duplicate value for ${field}. Please use another value.`
  }

  // Mongoose: schema validation failed
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ')
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  })
}

module.exports = { notFound, errorHandler }
