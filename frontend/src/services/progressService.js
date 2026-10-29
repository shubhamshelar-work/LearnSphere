// services/progressService.js
// Enrolment + lesson-completion endpoints plus derived dashboard helpers.

import api from './api'

export const progressService = {
  // A computed progress view for one course.
  async getCourseProgress(courseId) {
    const { data } = await api.get(`/progress/${courseId}`)
    return data.progress
  },

  // Every enrolment for the logged-in student (for the dashboard).
  async getMyProgress() {
    const { data } = await api.get('/progress')
    return data.enrolments || []
  },

  async markLessonComplete(lessonId, courseId) {
    const { data } = await api.put(`/progress/lessons/${lessonId}/complete`, { courseId })
    return data.progress
  },

  async markLessonIncomplete(lessonId, courseId) {
    const { data } = await api.put(`/progress/lessons/${lessonId}/incomplete`, { courseId })
    return data.progress
  },
}
