// services/api.js
// A single Axios instance shared by every service module.
//
// - withCredentials: the backend issues the JWT in an HttpOnly cookie, so the
//   browser must send it with every request.
// - Every response is normalised so callers get `data` directly, and every
//   error is turned into a plain Error carrying the backend message + status.

import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Turn an axios error into a readable Error so components can show err.message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status || 0
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.'

    const wrapped = new Error(message)
    wrapped.status = status
    return Promise.reject(wrapped)
  },
)

export default api
