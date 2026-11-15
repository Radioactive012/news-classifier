import { useEffect, useRef, useState } from 'react'
import { classify } from '../api.js'
import { MODELS, MODEL_SHORT, category, percent } from '../categories.js'
import { SAMPLES } from '../samples.js'

const MIN_WORDS = 20
const HISTORY_KEY = 'news-classifier-history'
const HISTORY_SIZE = 6

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? []
  } catch {
    return []
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  } catch {
    // Storage can be blocked (private mode); history then lasts only this visit.
  }
}

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0)

export default function Classify({ health }) {
  const [text, setText] = useState('')
  const [model, setModel] = useState('combined')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(loadHistory)
  const resultRef = useRef(null)

  const available = health?.models ?? {}
  const words = countWords(text)
  const tooShort = words > 0 && words < MIN_WORDS

  // If a model is not trained yet, fall back to one that is.
  useEffect(() => {
    if (health?.models && !health.models[model]) {
      const ready = MODELS.find((option) => health.models[option.id])
      if (ready) setModel(ready.id)
    }
  }, [health, model])

  async function run(articleText = text, modelId = model) {
    if (countWords(articleText) < MIN_WORDS || loading) return
    setLoading(true)
    setError('')
    // On phones the result is below the text box, so bring it into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
    try {
      // Wait at least a moment so the "AI is thinking" steps are visible.
      const [prediction] = await Promise.all([classify(articleText, modelId), new Promise((r) => setTimeout(r, 900))])
      setResult(prediction)
      const entry = {
        id: Date.now(),
        text: articleText,
        snippet: articleText.trim().slice(0, 110),
        category: prediction.category,
        confidence: prediction.confidence,
        model: prediction.model,
      }
      const next = [entry, ...history.filter((item) => item.text !== articleText || item.model !== modelId)].slice(0, HISTORY_SIZE)
      setHistory(next)
      saveHistory(next)
    } catch (err) {
      setError(err.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  function pickSample(sample) {
    setText(sample.text)
    setError('')
    run(sample.text)
  }

  function switchModel(id) {
    setModel(id)
    // Re-run straight away so the models are easy to compare.
    if (result && words >= MIN_WORDS) run(text, id)
  }

  return (
    <div className="space-y-12">
      <Hero />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        {/* Input */}
        <section className="card p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label htmlFor="article" className="font-display text-lg font-extrabold">📝 Your article</label>
            <span
              className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                tooShort ? 'border-amber-500 bg-amber-100 text-amber-800' : 'border-ink/15 text-ink/60'
              }`}
            >
              {words} {words === 1 ? 'word' : 'words'}{tooShort && ` · need ${MIN_WORDS}+`}
            </span>
          </div>
          <textarea
            id="article"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) run()
            }}
            placeholder="Paste a headline and the story here… or hit one of the samples below 👇"
            className="h-64 w-full resize-y rounded-xl border-2 border-ink bg-paper/60 p-4 text-[15px] leading-relaxed placeholder:text-ink/40 focus:bg-white focus:outline-none sm:h-72"
          />

          <div className="mt-5">
            <p className="label mb-2.5">Try a sample</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((sample) => {
                const meta = category(sample.label)
                return (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => pickSample(sample)}
                    disabled={loading}
                    title={sample.title}
                    className={`chip ${meta.tint} transition hover:-translate-y-0.5 hover:-rotate-2 hover:shadow-[2px_2px_0_0_var(--color-ink)] disabled:opacity-50`}
                  >
                    <span aria-hidden="true">{meta.emoji}</span> {meta.name}
                  </button>
                )
              })}
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="label mb-2.5">Pick a brain</legend>
            <div className="grid grid-cols-3 gap-2">
              {MODELS.map((option) => {
                const ready = available[option.id] !== false
                const active = model === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => switchModel(option.id)}
                    disabled={!ready || loading}
                    aria-pressed={active}
                    title={ready ? option.detail : 'Not trained yet'}
                    className={`rounded-xl border-2 border-ink px-2 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      active ? 'bg-ink text-white shadow-[3px_3px_0_0_var(--color-sun)]' : 'bg-white hover:bg-paper'
                    }`}
                  >
                    <span className="block text-xl" aria-hidden="true">{option.emoji}</span>
                    <span className="block text-sm font-bold">{option.name}</span>
                    <span className={`block text-[11px] ${active ? 'text-white/70' : 'text-ink/50'}`}>{option.detail}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-6 flex gap-3">
            {text && (
              <button
                type="button"
                onClick={() => { setText(''); setResult(null); setError('') }}
                className="btn bg-white"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => run()}
              disabled={words < MIN_WORDS || loading}
              className="btn flex-1 bg-sun py-3.5 font-display text-lg font-extrabold"
            >
              {loading ? 'Thinking…' : '✨ Classify it!'}
            </button>
          </div>
          <p className="mt-3 hidden text-right text-xs text-ink/40 sm:block">Tip: ⌘/Ctrl + Enter also works</p>
        </section>

        {/* Result */}
        <section ref={resultRef} aria-live="polite" className="scroll-mt-28">
          {error ? (
            <ErrorState message={error} onRetry={words >= MIN_WORDS ? () => run() : null} />
          ) : loading ? (
            <LoadingState model={model} />
          ) : result ? (
            <Result key={result.category + result.confidence + result.model} result={result} />
          ) : (
            <EmptyState />
          )}
        </section>
      </div>

      <History
        items={history}
        onOpen={(item) => {
          setText(item.text)
          setModel(item.model)
          run(item.text, item.model)
        }}
        onClear={() => { setHistory([]); saveHistory([]) }}
      />
    </div>
  )
}

function Hero() {
  const stickers = [
    { emoji: '⚽', className: 'right-[40%] top-40', r: '-12deg' },
    { emoji: '🏛️', className: 'right-[30%] -top-4', r: '8deg' },
    { emoji: '💼', className: 'right-[14%] top-14', r: '-6deg' },
    { emoji: '💻', className: 'right-[2%] -top-2', r: '14deg' },
    { emoji: '🎬', className: 'right-[22%] top-32', r: '-10deg' },
  ]
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        {stickers.map((s, i) => (
          <span
            key={s.emoji}
            className={`animate-float absolute grid size-14 place-items-center rounded-2xl border-2 border-ink bg-white text-3xl shadow-[3px_3px_0_0_var(--color-ink)] ${s.className}`}
            style={{ '--r': s.r, animationDelay: `${i * 0.6}s` }}
          >
            {s.emoji}
          </span>
        ))}
      </div>
      <div className="relative max-w-2xl">
        <p className="label mb-3">🤖 Powered by a neural network</p>
        <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">
          Paste the news. <br className="hidden sm:block" />
          Our{' '}
          <span className="relative inline-block">
            <span className="absolute inset-x-[-4px] bottom-1 h-[40%] -rotate-1 bg-sun" aria-hidden="true" />
            <span className="relative">AI</span>
          </span>{' '}
          sorts it.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink/70 text-pretty">
          A fine-tuned DistilBERT model reads any article and decides if it’s{' '}
          <b>business</b>, <b>entertainment</b>, <b>politics</b>, <b>sport</b> or <b>tech</b>, and shows how sure it is.
        </p>
      </div>
    </section>
  )
}

function Confetti({ color }) {
  const colors = [color, '#fde047', '#1c1917', '#ffffff']
  const pieces = Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * Math.PI * 2
    const distance = 90 + ((i * 37) % 70)
    return {
      '--x': `${Math.cos(angle) * distance}px`,
      '--y': `${Math.sin(angle) * distance - 30}px`,
      '--spin': `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
      background: colors[i % colors.length],
      animationDelay: `${(i % 5) * 20}ms`,
    }
  })
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-10" aria-hidden="true">
      {pieces.map((style, i) => (
        <span key={i} className="confetti-piece absolute size-2.5 rounded-[2px] border border-ink" style={style} />
      ))}
    </div>
  )
}

function Result({ result }) {
  const meta = category(result.category)
  const ranked = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1])
  const unsure = result.confidence < 0.6

  return (
    <div className="card relative overflow-visible">
      {result.confidence >= 0.8 && <Confetti color={meta.hex} />}

      {/* Coloured headline panel */}
      <div className={`relative overflow-hidden rounded-t-[14px] border-b-2 border-ink px-5 pb-6 pt-5 ${meta.bg}`}>
        <span className="pointer-events-none absolute -right-4 -top-6 text-[120px] leading-none opacity-25" aria-hidden="true">
          {meta.emoji}
        </span>
        <p className="label text-ink/70">The AI says…</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <span className="animate-stamp inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-4 py-2 font-display text-3xl font-extrabold uppercase tracking-wide shadow-[4px_4px_0_0_var(--color-ink)]">
            <span aria-hidden="true">{meta.emoji}</span> {meta.name}
          </span>
          <div className="text-right">
            <div className="font-display text-5xl leading-none font-extrabold tabular-nums">{Math.floor(result.confidence * 100)}%</div>
            <div className="text-xs font-bold uppercase tracking-widest text-ink/70">sure</div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {result.related.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink/60">Also related:</span>
            {result.related.map((label) => (
              <span key={label} className={`chip py-0.5 text-xs ${category(label).tint}`}>
                {category(label).emoji} {category(label).name} {percent(result.probabilities[label], 0)}
              </span>
            ))}
          </div>
        )}

        {unsure && (
          <p className="mb-4 rounded-xl border-2 border-amber-500 bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900">
            🤔 Not very sure. This article might cover more than one topic.
          </p>
        )}

        <div className="space-y-2.5">
          {ranked.map(([label, score], i) => {
            const item = category(label)
            const top = label === result.category
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="w-7 text-center text-lg" aria-hidden="true">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className={top ? 'font-bold' : 'text-ink/70'}>{item.name}</span>
                    <span className="font-semibold tabular-nums">{percent(score)}</span>
                  </div>
                  <div
                    className="h-3.5 overflow-hidden rounded-full border-2 border-ink bg-paper"
                    role="progressbar"
                    aria-label={item.name}
                    aria-valuenow={Math.round(score * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`animate-grow h-full ${top ? item.bg : 'bg-ink/25'}`}
                      style={{ width: `${Math.max(score * 100, 1)}%`, animationDelay: `${0.15 + i * 0.08}s` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {result.key_terms.length > 0 && (
          <div className="mt-6">
            <p className="label">🔑 Clue words</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.key_terms.map((term, i) => (
                <span
                  key={term}
                  className={`rounded-md px-2 py-0.5 text-sm font-semibold ${meta.tint}`}
                  style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}
                >
                  {term}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink/50">Words in your text that push hardest towards {meta.name.toLowerCase()} (from the TF-IDF model).</p>
          </div>
        )}

        <dl className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
          {[
            ['Brain', MODEL_SHORT[result.model]],
            ['Words', result.word_count.toLocaleString()],
            ['Speed', `${Math.round(result.elapsed_ms)} ms`],
          ].map(([term, value]) => (
            <div key={term} className="rounded-xl border-2 border-ink/15 bg-paper/60 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-widest text-ink/50">{term}</dt>
              <dd className="font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        {result.truncated && (
          <p className="mt-3 text-xs text-ink/60">
            Long article: DistilBERT read the first {result.max_tokens} tokens (about {Math.round(result.max_tokens * 0.75)} words), which include the headline and key facts.
          </p>
        )}
      </div>
    </div>
  )
}

const THINKING_STEPS = {
  combined: [
    ['✂️', 'Chopping the text into tokens'],
    ['🧠', 'DistilBERT reading with self-attention'],
    ['🔢', 'TF-IDF counting the clue words'],
    ['🤝', 'Averaging both opinions'],
  ],
  distilbert: [
    ['✂️', 'Chopping the text into tokens'],
    ['🧠', 'Running 6 Transformer layers'],
    ['📊', 'Softmax → probabilities'],
  ],
  baseline: [
    ['🔢', 'Scoring every word with TF-IDF'],
    ['⚖️', 'Weighing words per category'],
    ['📊', 'Turning scores into probabilities'],
  ],
}

function LoadingState({ model }) {
  const steps = THINKING_STEPS[model] ?? THINKING_STEPS.combined
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 260)
    return () => clearInterval(timer)
  }, [steps.length])

  return (
    <div className="card flex min-h-[420px] flex-col items-center justify-center p-6 text-center" aria-label="Classifying">
      <div className="relative mb-6 grid size-24 place-items-center rounded-2xl border-2 border-ink bg-paper text-5xl" aria-hidden="true">
        📰
        <span className="animate-scan absolute inset-x-1 h-1 rounded-full bg-red-500 shadow-[0_0_12px_2px_rgb(239_68_68/0.6)]" />
      </div>
      <p className="font-display text-xl font-extrabold">The AI is reading…</p>
      <ol className="mt-5 w-full max-w-xs space-y-2 text-left text-sm">
        {steps.map(([emoji, label], i) => (
          <li
            key={label}
            className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-1.5 transition ${
              i < step ? 'border-ink/15 text-ink/50' : i === step ? 'border-ink bg-sun font-bold' : 'border-transparent text-ink/30'
            }`}
          >
            <span aria-hidden="true">{i < step ? '✅' : emoji}</span> {label}
          </li>
        ))}
      </ol>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card flex min-h-[420px] flex-col items-center justify-center border-dashed p-6 text-center shadow-none">
      <div className="relative h-28 w-40" aria-hidden="true">
        {['bg-sky-300 -rotate-12 left-0', 'bg-pink-300 rotate-6 left-10', 'bg-lime-300 -rotate-3 left-5'].map((cls) => (
          <div key={cls} className={`absolute top-2 h-24 w-28 rounded-lg border-2 border-ink p-2 ${cls}`}>
            <div className="h-2 w-16 rounded bg-ink/60" />
            <div className="mt-2 h-1.5 w-20 rounded bg-ink/25" />
            <div className="mt-1 h-1.5 w-14 rounded bg-ink/25" />
            <div className="mt-1 h-1.5 w-18 rounded bg-ink/25" />
          </div>
        ))}
        <span className="absolute -right-2 -top-1 grid size-10 rotate-12 place-items-center rounded-full border-2 border-ink bg-sun font-display text-xl font-extrabold">
          ?
        </span>
      </div>
      <p className="mt-6 font-display text-xl font-extrabold">Waiting for a story</p>
      <p className="mt-1 max-w-xs text-sm text-ink/60">Paste an article or tap a sample, and the AI’s verdict lands here.</p>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex min-h-[420px] flex-col items-center justify-center bg-red-50 p-6 text-center">
      <span className="text-6xl" aria-hidden="true">😵</span>
      <p className="mt-4 font-display text-xl font-extrabold">Oops, something broke</p>
      <p className="mt-1 max-w-sm break-words text-sm text-ink/70">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn mt-5 bg-white">
          Try again
        </button>
      )}
    </div>
  )
}

function History({ items, onOpen, onClear }) {
  if (items.length === 0) return null
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-extrabold">🗂️ Recent predictions</h2>
        <button type="button" onClick={onClear} className="text-sm font-semibold text-ink/50 underline-offset-2 hover:text-ink hover:underline">
          Clear
        </button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const meta = category(item.category)
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="card block h-full w-full overflow-hidden text-left transition hover:-translate-y-1 hover:rotate-0"
                style={{ transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}
              >
                <div className={`flex items-center justify-between border-b-2 border-ink px-3 py-1.5 ${meta.bg}`}>
                  <span className="text-sm font-extrabold uppercase tracking-wide">{meta.emoji} {meta.name}</span>
                  <span className="font-display font-extrabold tabular-nums">{Math.floor(item.confidence * 100)}%</span>
                </div>
                <p className="line-clamp-2 px-3 pt-2 text-sm text-ink/80">{item.snippet}…</p>
                <p className="px-3 pb-2.5 pt-1 text-[11px] font-bold uppercase tracking-widest text-ink/40">{MODEL_SHORT[item.model]}</p>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
