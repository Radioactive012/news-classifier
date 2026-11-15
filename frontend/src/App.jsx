import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { getHealth } from './api.js'
import { category } from './categories.js'
import { SAMPLES } from './samples.js'
import Classify from './pages/Classify.jsx'
import Performance from './pages/Performance.jsx'
import About from './pages/About.jsx'

const LINKS = [
  { to: '/', label: 'Classify', emoji: '🔍' },
  { to: '/performance', label: 'Performance', emoji: '📊' },
  { to: '/about', label: 'How it works', emoji: '🧠' },
]

export default function App() {
  // null = still checking, otherwise the /health response or an error
  const [health, setHealth] = useState(null)

  useEffect(() => {
    const check = () =>
      getHealth()
        .then(setHealth)
        .catch((error) => setHealth({ error: error.message }))
    check()
    const timer = setInterval(check, 15000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Ticker />
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
          <BackendStatus health={health} />
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

// A scrolling "breaking news" strip made of the sample headlines.
function Ticker() {
  const items = [...SAMPLES, ...SAMPLES]
  return (
    <div className="overflow-hidden border-b-2 border-ink bg-red-500 text-white" aria-hidden="true">
      <div className="flex">
        <span className="z-10 shrink-0 bg-ink px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest text-sun">
          ● Live
        </span>
        <div className="flex animate-ticker whitespace-nowrap py-1.5 text-xs font-semibold">
          {items.map((sample, i) => (
            <span key={i} className="mx-6">
              <span className="mr-2 rounded bg-white/20 px-1.5 py-0.5 uppercase">{category(sample.label).emoji} {category(sample.label).name}</span>
              {sample.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function BackendStatus({ health }) {
  const state = !health ? 'checking' : health.error ? 'offline' : health.models.distilbert ? 'online' : 'partial'
  const [dot, text] = {
    checking: ['bg-stone-400', 'Connecting…'],
    offline: ['bg-red-500', 'Backend offline'],
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
        {state === 'online' && <span className={`absolute inline-flex size-full animate-ping rounded-full ${dot} opacity-75`} />}
        <span className={`relative inline-flex size-2.5 rounded-full border border-ink ${dot}`} />
      </span>
      {text}
    </div>
  )
}
