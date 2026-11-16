import { useEffect, useState } from 'react'

// Shown while the free Render server is waking up. The app knows the server
// is live when its /health check succeeds; this window then closes by itself.
export default function LoadingWindow({ ready, onClose }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (ready) return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [ready])

  // The server usually needs 30-60 seconds; the bar is an estimate.
  const progress = ready ? 100 : Math.min(95, (seconds / 50) * 100)
  const steps = [
    ['Waking the server', seconds >= 0],
    ['Loading the neural network', seconds >= 15],
    ['Warming up the TF-IDF model', seconds >= 30],
  ]

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
    >
      <div className="card w-full max-w-md overflow-hidden">
        <div className={`flex items-center justify-between border-b-2 border-ink px-5 py-3 ${ready ? 'bg-lime-300' : 'bg-sun'}`}>
          <p className="text-xs font-extrabold uppercase tracking-widest">{ready ? '● AI is live' : '● Starting up'}</p>
          <span className="font-display text-sm font-extrabold tabular-nums">{ready ? 'Ready' : `${seconds}s`}</span>
        </div>

        <div className="p-6 text-center">
          <div className="relative mx-auto mb-5 grid size-20 place-items-center rounded-2xl border-2 border-ink bg-paper text-4xl" aria-hidden="true">
            {ready ? '✅' : '📰'}
            {!ready && <span className="animate-scan absolute inset-x-1 h-1 rounded-full bg-red-500 shadow-[0_0_12px_2px_rgb(239_68_68/0.6)]" />}
          </div>
          <h2 id="loading-title" className="font-display text-2xl leading-tight font-extrabold">
            {ready ? 'The AI is ready!' : 'Waking up the AI…'}
          </h2>
          <p className="mt-2 text-sm text-ink/70 text-pretty">
            {ready
              ? 'Taking you to the newsroom.'
              : 'This site runs on a free server that sleeps when nobody is around. It takes about a minute to start.'}
          </p>

          <div
            className="mt-5 h-3 overflow-hidden rounded-full border-2 border-ink bg-paper"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Server start-up progress"
          >
            <div
              className={`h-full transition-[width] duration-1000 ease-linear ${ready ? 'bg-lime-400' : 'bg-ink'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="mt-5 space-y-1.5 text-left text-sm">
            {steps.map(([label, started], i) => {
              const done = ready || (steps[i + 1]?.[1] ?? false)
              return (
                <li key={label} className={`flex items-center gap-2 ${started || ready ? '' : 'text-ink/30'}`}>
                  <span className="w-5 text-center" aria-hidden="true">{done ? '✅' : started ? '⏳' : '·'}</span>
                  {label}
                </li>
              )
            })}
          </ol>

          {!ready && (
            <button type="button" onClick={onClose} className="mt-6 text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-ink">
              Hide this and wait
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
