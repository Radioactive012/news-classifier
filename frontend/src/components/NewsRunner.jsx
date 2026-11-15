import { useEffect, useRef, useState } from 'react'

// "Deadline Dash": a small endless-runner played while the AI server wakes up.
// You are a newspaper on legs, jumping over spam, paywalls and fake news.
// Space / ↑ / tap to jump.

const HEIGHT = 200
const GROUND = HEIGHT - 34
const PLAYER = { x: 56, w: 30, h: 36 }
const GRAVITY = 0.62
const JUMP = -11.6
const INK = '#1c1917'
const PAPER = '#fdf6e3'
const HIGH_SCORE_KEY = 'deadline-dash-best'

const OBSTACLES = [
  { label: 'SPAM', w: 34, h: 32, fill: '#f87171' },
  { label: 'PAYWALL', w: 22, h: 54, fill: '#fde047', vertical: true },
  { label: 'FAKE', w: 46, h: 26, fill: '#f472b6' },
  { label: '404', w: 28, h: 30, fill: '#a78bfa' },
  { label: 'CLICKBAIT', w: 24, h: 44, fill: '#38bdf8', vertical: true },
]
const DECOR = ['⚽', '💼', '🏛️', '💻', '🎬']

function readBest() {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0
  } catch {
    return 0
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score))
  } catch {
    // Best score is just not remembered if storage is blocked.
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
  ctx.stroke()
}

function drawPlayer(ctx, y, frame, onGround, dead) {
  const { x, w, h } = PLAYER
  ctx.lineWidth = 2.5
  ctx.strokeStyle = INK
  // Legs: alternate while running, tucked while jumping
  const step = Math.floor(frame / 6) % 2
  ctx.beginPath()
  if (onGround && !dead) {
    ctx.moveTo(x + 9, y + h); ctx.lineTo(x + 9 + (step ? 4 : -3), y + h + 8)
    ctx.moveTo(x + 21, y + h); ctx.lineTo(x + 21 + (step ? -3 : 4), y + h + 8)
  } else {
    ctx.moveTo(x + 9, y + h); ctx.lineTo(x + 5, y + h + 5)
    ctx.moveTo(x + 21, y + h); ctx.lineTo(x + 25, y + h + 5)
  }
  ctx.stroke()
  // Body: a folded newspaper
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, x, y, w, h, 3)
  ctx.fillStyle = INK
  ctx.fillRect(x + 5, y + 6, w - 10, 4) // masthead
  ctx.lineWidth = 1.5
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(x + 5, y + 17 + i * 5)
    ctx.lineTo(x + w - 5 - (i === 2 ? 8 : 0), y + 17 + i * 5)
    ctx.stroke()
  }
  // Eyes
  ctx.fillStyle = INK
  if (dead) {
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('x x', x + 8, y + 15)
  } else {
    ctx.beginPath(); ctx.arc(x + 11, y + 13, 1.8, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 20, y + 13, 1.8, 0, Math.PI * 2); ctx.fill()
  }
}

function drawObstacle(ctx, o) {
  ctx.lineWidth = 2.5
  ctx.strokeStyle = INK
  ctx.fillStyle = o.fill
  roundRect(ctx, o.x, GROUND - o.h, o.w, o.h, 3)
  ctx.fillStyle = INK
  ctx.font = '800 9px "Bricolage Grotesque Variable", sans-serif'
  ctx.textAlign = 'center'
  if (o.vertical) {
    ctx.save()
    ctx.translate(o.x + o.w / 2 + 3, GROUND - o.h / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(o.label, 0, 0)
    ctx.restore()
  } else {
    ctx.fillText(o.label, o.x + o.w / 2, GROUND - o.h / 2 + 3)
  }
  ctx.textAlign = 'left'
}

export default function NewsRunner() {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const game = useRef(null)
  const [status, setStatus] = useState('ready') // ready | running | over
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)

  function reset() {
    game.current = {
      y: GROUND - PLAYER.h,
      vy: 0,
      speed: 5.2,
      obstacles: [],
      nextIn: 60,
      frame: 0,
      distance: 0,
      decor: DECOR.map((emoji, i) => ({ emoji, x: 80 + i * 130, y: 26 + (i % 3) * 22 })),
      groundOffset: 0,
    }
  }

  function jump() {
    const g = game.current
    if (status !== 'running') {
      reset()
      setScore(0)
      setStatus('running')
      return
    }
    if (g.y >= GROUND - PLAYER.h - 0.5) g.vy = JUMP
  }

  // Keyboard controls (only while this game is on screen)
  useEffect(() => {
    const onKey = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return
        event.preventDefault()
        jump()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Game loop and drawing
  useEffect(() => {
    if (!game.current) reset()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    let last = performance.now()

    const loop = (now) => {
      const width = wrapRef.current?.clientWidth ?? 600
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== Math.round(width * dpr)) {
        canvas.width = Math.round(width * dpr)
        canvas.height = HEIGHT * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${HEIGHT}px`
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Advance in 60-fps steps so speed is the same on every screen.
      const steps = Math.min(4, Math.round((now - last) / (1000 / 60)) || 1)
      last = now
      const g = game.current
      for (let s = 0; s < steps && status === 'running'; s++) {
        g.frame++
        g.speed += 0.0016
        g.distance += g.speed
        g.vy += GRAVITY
        g.y = Math.min(g.y + g.vy, GROUND - PLAYER.h)
        if (g.y === GROUND - PLAYER.h) g.vy = 0
        g.groundOffset = (g.groundOffset + g.speed) % 24
        for (const d of g.decor) {
          d.x -= g.speed * 0.25
          if (d.x < -30) d.x = width + Math.random() * 120
        }
        g.nextIn--
        if (g.nextIn <= 0) {
          const kind = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)]
          g.obstacles.push({ ...kind, x: width + 10 })
          // Gap shrinks a little as you speed up, but always stays jumpable.
          g.nextIn = Math.max(38, 70 + Math.random() * 70 - g.speed * 3)
        }
        for (const o of g.obstacles) o.x -= g.speed
        g.obstacles = g.obstacles.filter((o) => o.x + o.w > -10)
        // Collision, with a small forgiving margin
        const hit = g.obstacles.some(
          (o) =>
            PLAYER.x + 5 < o.x + o.w &&
            PLAYER.x + PLAYER.w - 5 > o.x &&
            g.y + PLAYER.h - 2 > GROUND - o.h,
        )
        if (hit) {
          const final = Math.floor(g.distance / 10)
          setScore(final)
          if (final > readBest()) {
            saveBest(final)
            setBest(final)
          }
          setStatus('over')
        }
      }
      if (status === 'running' && g.frame % 5 === 0) setScore(Math.floor(g.distance / 10))

      // ---- Draw ----
      ctx.fillStyle = PAPER
      ctx.fillRect(0, 0, width, HEIGHT)
      // Halftone dots
      ctx.fillStyle = 'rgba(28,25,23,0.06)'
      for (let x = (-g.groundOffset * 0.25) % 18; x < width; x += 18) {
        for (let y = 6; y < HEIGHT; y += 18) ctx.fillRect(x, y, 1.5, 1.5)
      }
      // Drifting section icons
      ctx.globalAlpha = 0.35
      ctx.font = '20px sans-serif'
      for (const d of g.decor) ctx.fillText(d.emoji, d.x, d.y)
      ctx.globalAlpha = 1
      // Ground
      ctx.strokeStyle = INK
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(0, GROUND + 0.5)
      ctx.lineTo(width, GROUND + 0.5)
      ctx.stroke()
      ctx.lineWidth = 2
      for (let x = -g.groundOffset; x < width; x += 24) {
        ctx.beginPath()
        ctx.moveTo(x, GROUND + 12)
        ctx.lineTo(x + 8, GROUND + 12)
        ctx.stroke()
      }
      for (const o of g.obstacles) drawObstacle(ctx, o)
      drawPlayer(ctx, g.y, g.frame, g.y >= GROUND - PLAYER.h - 0.5, status === 'over')

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [status])

  return (
    <div className="relative" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={(event) => { event.preventDefault(); jump() }}
        className="block w-full cursor-pointer touch-manipulation rounded-xl border-2 border-ink"
        aria-label="Deadline Dash game. Press space or tap to jump."
        role="img"
      />
      <div className="pointer-events-none absolute right-3 top-2 text-right font-display text-sm font-extrabold tabular-nums">
        <div>{String(score).padStart(5, '0')}</div>
        <div className="text-[11px] text-ink/50">BEST {String(best).padStart(5, '0')}</div>
      </div>
      {status !== 'running' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="rounded-xl border-2 border-ink bg-white px-4 py-2 text-center shadow-[3px_3px_0_0_var(--color-ink)]">
            <p className="font-display text-lg font-extrabold">{status === 'over' ? 'Missed the deadline!' : 'Deadline Dash'}</p>
            <p className="text-xs font-semibold text-ink/60">
              {status === 'over' ? `${score} stories dodged · ` : 'Jump the spam, paywalls and fake news · '}
              Space or tap to {status === 'over' ? 'retry' : 'start'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
