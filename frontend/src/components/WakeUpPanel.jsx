import { useEffect, useState } from 'react'
import NewsRunner from './NewsRunner.jsx'

// Shown while the free Render server is waking up (about a minute after it
// has been idle). The visitor can play a game and is told when the AI is ready.
export default function WakeUpPanel({ ready, failed, onClose }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (ready) return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [ready])

  // Rough progress: the server usually needs 40-60 seconds.
  const progress = ready ? 100 : Math.min(95, (seconds / 55) * 100)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="wake-title">
      <div className="card w-full max-w-2xl overflow-hidden">
        <div className={`flex items-center justify-between gap-3 border-b-2 border-ink px-5 py-3 ${ready ? 'bg-lime-300' : 'bg-sun'}`}>
          <p className="text-xs font-extrabold uppercase tracking-widest">
            {ready ? '● The AI is awake' : '● Waking up the newsroom'}
          </p>
          <span className="font-display text-sm font-extrabold tabular-nums">{ready ? 'Ready' : `${seconds}s`}</span>
        </div>

        <div className="p-5">
          <h2 id="wake-title" className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">
            {ready ? 'The AI is awake! ✨' : 'The AI is having its morning coffee ☕'}
          </h2>
          <p className="mt-2 text-sm text-ink/70 text-pretty">
            {ready
              ? 'All set. Taking you back to the newsroom…'
              : failed
                ? 'Still knocking on the server’s door. Free servers sleep after 15 quiet minutes and take about a minute to wake up. Beat a high score while you wait.'
                : 'This site runs on a free server that naps when nobody is around. Waking it takes about a minute, so beat a high score while you wait.'}
          </p>

          <div className="mt-4 h-3 overflow-hidden rounded-full border-2 border-ink bg-paper" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Server wake-up progress">
            <div
              className={`h-full transition-[width] duration-1000 ease-linear ${ready ? 'bg-lime-400' : 'bg-sun'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5">
            <NewsRunner />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink/50">Space / ↑ / tap to jump · Your best score is saved in this browser.</p>
            {ready ? (
              <button type="button" onClick={onClose} className="btn bg-sun px-5 py-3 font-display text-base font-extrabold">
                Let’s classify →
              </button>
            ) : (
              <button type="button" onClick={onClose} className="btn bg-white text-sm">
                Hide and wait
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
