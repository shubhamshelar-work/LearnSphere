// services/courseService.js
// Reads/writes courses and turns the API shape into a UI-friendly shape.
//
// The backend stores `_id` at the course/module/lesson level; the existing UI
// components were written against `id` slugs. `normalizeCourse` adds those
// aliases (and safe fallbacks for display-only fields the API does not store)
// so components barely need to change.

import api from './api'

// Add an `id` alias so existing UI code keeps working with Mongo ids.
export function normalizeCourse(course) {
  if (!course) return null

  const modules = (course.modules || []).map((module) => ({
    ...module,
    id: module._id,
    lessons: (module.lessons || []).map((lesson) => ({
      ...lesson,
      id: lesson._id,
    })),
  }))

  const lessonCount = modules.reduce(
    (total, module) => total + module.lessons.length,
    0,
  )

  return {
    ...course,
    id: course._id,
    modules,
    lessonCount,
    // Display-only fields the API does not persist yet — kept optional so the
    // UI can hide them gracefully.
    shortDescription: course.shortDescription || course.description || '',
    duration: course.duration || '',
    rating: course.rating ?? null,
    enrolledStudents: course.enrolledStudents ?? null,
    outcomes: course.outcomes || [],
  }
}

export const courseService = {
  // Public catalogue (published only). Supports search/category/difficulty.
  async listCourses(params = {}) {
    const { data } = await api.get('/courses', { params })
    return (data.courses || []).map(normalizeCourse)
  },

  // Every course, published or not. Admin only.
  async listAllCourses() {
    const { data } = await api.get('/courses/admin/all')
    return (data.courses || []).map(normalizeCourse)
  },

  async getCourse(id) {
    const { data } = await api.get(`/courses/${id}`)
    return normalizeCourse(data.course)
  },

  async enroll(courseId) {
    const { data } = await api.post(`/courses/${courseId}/enroll`)
    return data
  },

  async createCourse(payload) {
    const { data } = await api.post('/courses', payload)
    return normalizeCourse(data.course)
  },

  async updateCourse(id, payload) {
    const { data } = await api.put(`/courses/${id}`, payload)
    return normalizeCourse(data.course)
  },

  async deleteCourse(id) {
    const { data } = await api.delete(`/courses/${id}`)
    return data
  },
}
