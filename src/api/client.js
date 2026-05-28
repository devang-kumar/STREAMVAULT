const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const getAuthHeader = () => {
  const token = localStorage.getItem('sv_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}, needsAuth = false) {
  const headers = {
    ...(needsAuth ? getAuthHeader() : {}),
    ...(options.headers || {})
  }

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message = data?.message || `Request failed: ${res.status}`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

// ─── Auth ────────────────────────────────────────────────────────────────
export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function register(name, email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  })
}

export async function getMe() {
  return request('/auth/me', { method: 'GET' }, true)
}

// ─── Public Shows ────────────────────────────────────────────────────────
export async function getShows(filters = {}) {
  const params = new URLSearchParams()
  if (filters.genre) params.set('genre', filters.genre)
  if (filters.tag) params.set('tag', filters.tag)
  const query = params.toString() ? `?${params.toString()}` : ''
  return request(`/shows${query}`, { method: 'GET' })
}

export async function getShow(id) {
  return request(`/shows/${id}`, { method: 'GET' })
}

// ─── Public Episodes ─────────────────────────────────────────────────────
export async function getEpisodes(showId) {
  const query = showId !== undefined && showId !== null ? `?showId=${encodeURIComponent(showId)}` : ''
  return request(`/episodes${query}`, { method: 'GET' })
}

export async function getEpisode(id) {
  return request(`/episodes/${id}`, { method: 'GET' }, true)
}

// ─── User Actions ────────────────────────────────────────────────────────
export async function updateContinueWatching(showId, episode, progress) {
  return request('/users/continue-watching', {
    method: 'PATCH',
    body: JSON.stringify({ showId, episode, progress })
  }, true)
}

export async function updatePlan(plan) {
  return request('/users/plan', {
    method: 'PATCH',
    body: JSON.stringify({ plan })
  }, true)
}

// ─── Admin: Stats ────────────────────────────────────────────────────────
export async function adminGetStats() {
  return request('/admin/stats', { method: 'GET' }, true)
}

export async function adminGetAnalytics() {
  return request('/admin/analytics', { method: 'GET' }, true)
}

// ─── Admin: Series CRUD ──────────────────────────────────────────────────
export async function adminGetSeries() {
  return request('/admin/series', { method: 'GET' }, true)
}

export async function adminGetContentIndex({ q = '', type = 'series' } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (type) params.set('type', type)
  const query = params.toString() ? `?${params.toString()}` : ''
  return request(`/admin/content-index${query}`, { method: 'GET' }, true)
}

export async function adminGetMovies() {
  return request('/admin/movies', { method: 'GET' }, true)
}

export async function adminCreateMovie(formData) {
  return request('/admin/movies', {
    method: 'POST',
    body: formData
  }, true)
}

export async function adminUpdateMovie(id, formData) {
  return request(`/admin/movies/${id}`, {
    method: 'PUT',
    body: formData
  }, true)
}

export async function adminDeleteMovie(id) {
  return request(`/admin/movies/${id}`, { method: 'DELETE' }, true)
}

export async function adminCreateSeries(formData) {
  return request('/admin/series', {
    method: 'POST',
    body: formData
  }, true)
}

export async function adminUpdateSeries(id, formData) {
  return request(`/admin/series/${id}`, {
    method: 'PUT',
    body: formData
  }, true)
}

export async function adminDeleteSeries(id) {
  return request(`/admin/series/${id}`, { method: 'DELETE' }, true)
}

export async function adminTogglePublish(id) {
  return request(`/admin/series/${id}/publish`, { method: 'PATCH' }, true)
}

export async function adminCreateShow(data) {
  return request('/shows', {
    method: 'POST',
    body: JSON.stringify(data)
  }, true)
}

export async function adminDeleteShow(id) {
  return request(`/shows/${id}`, { method: 'DELETE' }, true)
}

// ─── Admin: Episodes CRUD ────────────────────────────────────────────────
export async function adminGetEpisodes() {
  return request('/admin/episodes', { method: 'GET' }, true)
}

export async function adminCreateEpisode(data) {
  return request('/admin/episodes', {
    method: 'POST',
    body: data
  }, true)
}

export async function adminUpdateEpisode(id, formData) {
  return request(`/admin/episodes/${id}`, {
    method: 'PUT',
    body: formData
  }, true)
}

export async function adminDeleteEpisode(id) {
  return request(`/admin/episodes/${id}`, { method: 'DELETE' }, true)
}

// ─── Admin: Users ────────────────────────────────────────────────────────
export async function adminGetUsers() {
  return request('/admin/users', { method: 'GET' }, true)
}

export async function adminDeleteUser(id) {
  return request(`/admin/users/${id}`, { method: 'DELETE' }, true)
}

export async function adminUpdateUserRole(id, role) {
  return request(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  }, true)
}

// ─── Admin: Upload ───────────────────────────────────────────────────────
export async function adminUploadFile(file, folder = 'streamvault/general') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  return request('/admin/upload-cloudinary', {
    method: 'POST',
    body: formData
  }, true)
}

// Dedicated image upload with proper mime validation
export async function adminUploadImage(file, folder = 'streamvault/images') {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('folder', folder)
  return request('/admin/upload/image', {
    method: 'POST',
    body: formData
  }, true)
}

// Dedicated video upload with proper mime validation and 300MB limit
export async function adminUploadVideo(file, folder = 'streamvault/videos') {
  const formData = new FormData()
  formData.append('video', file)
  formData.append('folder', folder)
  return request('/admin/upload/video', {
    method: 'POST',
    body: formData
  }, true)
}

export async function adminGetUploadSignature(folder = 'streamvault/general') {
  return request(`/admin/upload-signature?folder=${encodeURIComponent(folder)}`, { method: 'GET' }, true)
}

// ─── Payments ────────────────────────────────────────────────────────────
export async function createPaymentOrder(planId, amount) {
  return request('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ planId, amount })
  }, true)
}

export async function verifyPayment(paymentData) {
  return request('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  }, true)
}
