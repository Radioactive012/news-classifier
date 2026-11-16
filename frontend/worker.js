// Cloudflare Worker in front of the website.
//
// /api/* is passed on to the AI server on Render, so the browser only ever
// talks to this one address. That avoids cross-site requests, which some
// browsers (for example Brave with Shields up) block. Everything else is
// served from the built React app in ./dist.

const API_ORIGIN = 'https://news-classifier-api-j5qn.onrender.com'
const MAX_BODY_BYTES = 200_000

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return Response.json({ detail: 'Method not allowed.' }, { status: 405 })
      }
      // Read the body here (capped) so oversized uploads never reach Render.
      let body
      if (request.method === 'POST') {
        body = await request.arrayBuffer()
        if (body.byteLength > MAX_BODY_BYTES) {
          return Response.json({ detail: 'The article is too long. Paste at most about 50,000 characters.' }, { status: 413 })
        }
      }
      const target = API_ORIGIN + url.pathname.slice('/api'.length) + url.search
      try {
        const response = await fetch(target, {
          method: request.method,
          headers: { 'content-type': request.headers.get('content-type') ?? 'application/json' },
          body,
        })
        return new Response(response.body, {
          status: response.status,
          headers: { 'content-type': response.headers.get('content-type') ?? 'application/json', 'cache-control': 'no-store' },
        })
      } catch {
        // Render is restarting or asleep and refused the connection.
        return Response.json({ detail: 'The AI server is waking up.' }, { status: 503 })
      }
    }

    return env.ASSETS.fetch(request)
  },

  // Runs every 10 minutes (see "triggers" in wrangler.jsonc). Render's free
  // server sleeps after 15 minutes without requests, so this ping keeps it
  // awake and visitors never wait for it to start.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      fetch(`${API_ORIGIN}/health`, { headers: { 'user-agent': 'news-classifier-keepalive' } })
        .then((response) => console.log(`keep-awake ping: ${response.status}`))
        .catch((error) => console.log(`keep-awake ping failed: ${error}`)),
    )
  },
}
