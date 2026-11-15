import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { getHealth } from './api.js'
import Classify from './pages/Classify.jsx'
import Performance from './pages/Performance.jsx'
import About from './pages/About.jsx'

const LINKS = [
  { to: '/', label: 'Classify' },
  { to: '/performance', label: 'Model performance' },
  { to: '/about', label: 'About' },
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
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-stone-900 font-serif text-lg font-semibold text-white">N</span>
            <span className="font-serif text-lg font-semibold tracking-tight">News Classifier</span>
          </NavLink>
          <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <BackendStatus health={health} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Routes>
          <Route path="/" element={<Classify health={health} />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<p className="text-stone-600">Page not found.</p>} />
        </Routes>
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        News article classification with a fine-tuned DistilBERT neural network · College AI project
      </footer>
    </div>
  )
}

function BackendStatus({ health }) {
  const state = !health ? 'checking' : health.error ? 'offline' : health.models.distilbert ? 'online' : 'partial'
  const styles = {
    checking: ['bg-stone-400', 'Connecting…'],
    offline: ['bg-rose-500', 'Backend offline'],
    partial: ['bg-amber-500', 'Baseline only'],
    online: ['bg-emerald-500', 'Models ready'],
  }[state]
  return (
    <div className="ml-auto flex items-center gap-2 text-xs font-medium text-stone-600" title={health?.error ?? ''} role="status">
      <span className={`size-2 rounded-full ${styles[0]} ${state === 'online' ? 'shadow-[0_0_0_3px] shadow-emerald-500/20' : ''}`} />
      {styles[1]}
    </div>
  )
}
