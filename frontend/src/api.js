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
      import.meta.env.DEV
        ? 'Cannot reach the backend. Start it with: uvicorn backend.main:app --port 8000'
        : 'The AI server is waking up (it naps when nobody is around). Give it a minute and try again.',
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

// The free Render server sleeps when idle and only wakes for direct requests,
// not ones relayed through the Cloudflare site. So while the AI is asleep the
// browser pings it directly. 'no-cors' means we never read the reply; the
// request itself is what wakes the server.
const WAKE_URL = import.meta.env.VITE_WAKE_URL
export function wakeServer() {
  if (WAKE_URL) fetch(WAKE_URL, { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
}
export const getMetrics = () => request('/metrics')
export const classify = (text, model) =>
  request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model }),
  })
