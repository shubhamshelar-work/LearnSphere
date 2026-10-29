// utils/asyncHandler.js
// Wraps an async controller so any thrown error is passed to Express.
// Without this, an error inside an async function would not reach errorMiddleware.

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = asyncHandler
