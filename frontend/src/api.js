// In development the backend runs separately on port 8000. In the built app
// FastAPI serves the frontend itself, so requests go to the same address.
const API_URL = (import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '')

export class ApiError extends Error {}

async function request(path, options) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, options)
  } catch {
    throw new ApiError(
      'Cannot reach the backend. Start it with: uvicorn backend.main:app --port 8000',
    )
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`
    throw new ApiError(detail)
  }
  return body
}

export const getHealth = () => request('/health')
export const getMetrics = () => request('/metrics')
export const classify = (text, model) =>
  request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model }),
  })
