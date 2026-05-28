import { getAuthHeader } from '../../api/client'

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api/cms')

async function request(path, options = {}) {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {})
  }

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

// ─── Genres ────────────────────────────────────────────────────────────
export async function getGenres() {
  return request('/genres')
}

// ─── Series ────────────────────────────────────────────────────────────
export async function getSeries(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v))
  })
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return request(`/series${qs}`)
}

export async function getSeriesById(id) {
  return request(`/series/${id}`)
}

export async function createSeries(formData) {
  return request('/series', { method: 'POST', body: formData })
}

export async function updateSeries(id, formData) {
  return request(`/series/${id}`, { method: 'PATCH', body: formData })
}

export async function deleteSeries(id) {
  return request(`/series/${id}`, { method: 'DELETE' })
}

// ─── Seasons ───────────────────────────────────────────────────────────
export async function getSeasons(seriesId) {
  return request(`/series/${seriesId}/seasons`)
}

export async function createSeason(seriesId, data) {
  return request(`/series/${seriesId}/seasons`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function getSeasonById(seriesId, seasonId) {
  return request(`/series/${seriesId}/seasons/${seasonId}`)
}

export async function updateSeason(seriesId, seasonId, data) {
  return request(`/series/${seriesId}/seasons/${seasonId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteSeason(seriesId, seasonId) {
  return request(`/series/${seriesId}/seasons/${seasonId}`, { method: 'DELETE' })
}

// ─── Episodes ──────────────────────────────────────────────────────────
export async function getEpisodes(seriesId, seasonId) {
  return request(`/series/${seriesId}/seasons/${seasonId}/episodes`)
}

export async function createEpisode(seriesId, seasonId, formData) {
  return request(`/series/${seriesId}/seasons/${seasonId}/episodes`, {
    method: 'POST',
    body: formData
  })
}

export async function getEpisodeById(episodeId) {
  return request(`/episodes/${episodeId}`)
}

export async function updateEpisode(episodeId, formData) {
  return request(`/episodes/${episodeId}`, { method: 'PATCH', body: formData })
}

export async function deleteEpisode(episodeId) {
  return request(`/episodes/${episodeId}`, { method: 'DELETE' })
}

export async function reorderEpisodes(order) {
  return request('/episodes/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ order })
  })
}

// ─── Movies ────────────────────────────────────────────────────────────
export async function getMovies(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v))
  })
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return request(`/movies${qs}`)
}

export async function getMovieById(id) {
  return request(`/movies/${id}`)
}

export async function createMovie(formData) {
  return request('/movies', { method: 'POST', body: formData })
}

export async function updateMovie(id, formData) {
  return request(`/movies/${id}`, { method: 'PATCH', body: formData })
}

export async function deleteMovie(id) {
  return request(`/movies/${id}`, { method: 'DELETE' })
}

// ─── Search ────────────────────────────────────────────────────────────
export async function searchContent(q, type = 'all') {
  const params = new URLSearchParams({ q, type })
  return request(`/search?${params.toString()}`)
}