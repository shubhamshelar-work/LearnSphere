// services/quizService.js
// Public quiz listing + the secure attempt lifecycle, and admin quiz CRUD.
//
// Security note: the server never sends correct answers before submission.
// The client stores only the attemptId and the answers the student selected;
// grading always happens on the backend.

import api from './api'

export const quizService = {
  // ---- Public metadata ----
  async getQuizzesByCourse(courseId) {
    const { data } = await api.get(`/quizzes/course/${courseId}`)
    return data.quizzes || []
  },

  async getQuizByModule(courseId, moduleId) {
    const { data } = await api.get(`/quizzes/module/${courseId}/${moduleId}`)
    return data.quiz
  },

  // ---- Student attempt lifecycle ----
  // Starts a new attempt or resumes the open one. Returns the attempt state
  // (questions, options, secondsLeft, saved answers, attemptId).
  async startAttempt(quizId) {
    const { data } = await api.post(`/quizzes/${quizId}/start`)
    return data
  },

  async getAttempt(attemptId) {
    const { data } = await api.get(`/quizzes/attempts/${attemptId}`)
    return data
  },

  async saveAnswers(attemptId, answers) {
    const { data } = await api.patch(`/quizzes/attempts/${attemptId}/answers`, { answers })
    return data
  },

  async recordEvent(attemptId) {
    const { data } = await api.post(`/quizzes/attempts/${attemptId}/events`, {})
    return data
  },

  async submitAttempt(attemptId, answers) {
    const { data } = await api.post(`/quizzes/attempts/${attemptId}/submit`, { answers })
    return data
  },

  async getMyAttempts(courseId) {
    const { data } = await api.get('/quizzes/my-attempts', {
      params: courseId ? { courseId } : {},
    })
    return data.attempts || []
  },

  // ---- Admin CRUD ----
  async getQuizForAdmin(quizId) {
    const { data } = await api.get(`/quizzes/${quizId}/admin`)
    return data.quiz
  },

  // Returns the module's quiz (any status) or null when none exists yet.
  async getQuizForModuleAdmin(courseId, moduleId) {
    try {
      const { data } = await api.get(`/quizzes/admin/module/${courseId}/${moduleId}`)
      return data.quiz
    } catch (error) {
      if (error.status === 404) return null
      throw error
    }
  },

  async createQuiz(payload) {
    const { data } = await api.post('/quizzes', payload)
    return data.quiz
  },

  async updateQuiz(quizId, payload) {
    const { data } = await api.put(`/quizzes/${quizId}`, payload)
    return data.quiz
  },

  async deleteQuiz(quizId) {
    const { data } = await api.delete(`/quizzes/${quizId}`)
    return data
  },
}
