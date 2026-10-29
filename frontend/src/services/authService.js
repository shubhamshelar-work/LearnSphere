// services/authService.js
// Thin wrappers around the /api/auth endpoints.

import api from './api'

export const authService = {
  async register({ name, email, password }) {
    const { data } = await api.post('/auth/register', { name, email, password })
    return data
  },

  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  async logout() {
    const { data } = await api.post('/auth/logout')
    return data
  },

  // Returns the current user or throws (401 when not signed in).
  async me() {
    const { data } = await api.get('/auth/me')
    return data.user
  },
}
