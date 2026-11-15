import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { getHealth } from './api.js'
import Classify from './pages/Classify.jsx'
import Performance from './pages/Performance.jsx'
import About from './pages/About.jsx'
import WakeUpPanel from './components/WakeUpPanel.jsx'

const LINKS = [
  { to: '/', label: 'Classify', emoji: '🔍' },
  { to: '/performance', label: 'Performance', emoji: '📊' },
  { to: '/about', label: 'How it works', emoji: '🧠' },
]

export default function App() {
  // null = still checking, otherwise the /health response or an error
  const [health, setHealth] = useState(null)
  // 'hidden' | 'waking' | 'ready' | 'dismissed': the wake-up game panel
  const [panel, setPanel] = useState('hidden')
  const ready = Boolean(health && !health.error)
  // When the health checks started failing, to tell "waking up" from "down".
  const [failingSince, setFailingSince] = useState(null)

  useEffect(() => {
    let timer
    let stopped = false
    // Check again soon while the server is asleep, slowly once it is up.
    const check = async () => {
      let ok = false
      try {
        setHealth(await getHealth())
        setFailingSince(null)
        ok = true
      } catch (error) {
        setHealth({ error: error.message })
        setFailingSince((since) => since ?? Date.now())
      }
      if (!stopped) timer = setTimeout(check, ok ? 15000 : 4000)
    }
    check()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [])

  // A sleeping free server answers slowly. Only open the game if the AI is
  // still not ready after 1.5 s, so it never flashes up when the server is awake.
  useEffect(() => {
    if (ready || panel !== 'hidden') return
    const timer = setTimeout(() => setPanel('waking'), 1500)
    return () => clearTimeout(timer)
  }, [ready, panel])

  // When the AI comes online, show "awake" for a moment, then close the game.
  useEffect(() => {
    if (ready && panel === 'waking') setPanel('ready')
    if (panel !== 'ready') return
    const timer = setTimeout(() => setPanel('dismissed'), 2000)
    return () => clearTimeout(timer)
  }, [ready, panel])

  return (
    <div className="flex min-h-screen flex-col">
      {(panel === 'waking' || panel === 'ready') && (
        <WakeUpPanel ready={ready} failed={Boolean(health?.error)} onClose={() => setPanel('dismissed')} />
      )}
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <NavLink to="/" className="group flex items-center gap-2.5">
            <span className="grid size-10 -rotate-6 place-items-center rounded-xl border-2 border-ink bg-sun text-xl shadow-[3px_3px_0_0_var(--color-ink)] transition group-hover:rotate-6">
              📰
            </span>
            <span className="font-display text-xl leading-none font-extrabold tracking-tight">
              News <span className="text-red-500">Classifier</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">AI news classifier</span>
            </span>
          </NavLink>
          <nav className="order-last -mx-1 flex w-full gap-1.5 overflow-x-auto px-1 pb-1 sm:order-none sm:w-auto sm:pb-0">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition ${
                    isActive
                      ? 'border-ink bg-ink text-white'
                      : 'border-transparent text-ink/70 hover:border-ink hover:bg-white hover:text-ink'
                  }`
                }
              >
                <span aria-hidden="true">{link.emoji}</span> {link.label}
              </NavLink>
            ))}
          </nav>
          <BackendStatus health={health} failingSince={failingSince} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Routes>
          <Route path="/" element={<Classify health={health} />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<p className="font-display text-2xl font-bold">404: this page didn’t make the paper.</p>} />
        </Routes>
      </main>

      <footer className="border-t-2 border-ink bg-ink py-6 text-center text-sm text-white/70">
        Built with a fine-tuned <span className="font-semibold text-sun">DistilBERT</span> neural network · College AI project
      </footer>
    </div>
  )
}

function BackendStatus({ health, failingSince }) {
  // A free server that is waking up fails health checks for about a minute,
  // so only call it offline after 3 minutes of failures.
  const down = failingSince && Date.now() - failingSince > 3 * 60 * 1000
  const state = !health ? 'checking' : health.error ? (down ? 'offline' : 'waking') : health.models.distilbert ? 'online' : 'partial'
  const [dot, text] = {
    checking: ['bg-stone-400', 'Connecting…'],
    waking: ['bg-amber-400', 'Waking up the AI…'],
    offline: ['bg-red-500', 'AI offline'],
    partial: ['bg-amber-400', 'Baseline only'],
    online: ['bg-lime-400', 'AI ready'],
  }[state]
  return (
    <div
      className="ml-auto flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold"
      title={health?.error ?? ''}
      role="status"
    >
      <span className="relative flex size-2.5">
        {(state === 'online' || state === 'waking') && <span className={`absolute inline-flex size-full animate-ping rounded-full ${dot} opacity-75`} />}
        <span className={`relative inline-flex size-2.5 rounded-full border border-ink ${dot}`} />
      </span>
      {text}
    </div>
  )
}
