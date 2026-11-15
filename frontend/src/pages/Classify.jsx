import { useEffect, useRef, useState } from 'react'
import { classify } from '../api.js'
import { MODELS, category, percent } from '../categories.js'
import { SAMPLES } from '../samples.js'

const MIN_WORDS = 20
const HISTORY_KEY = 'news-classifier-history'
const HISTORY_SIZE = 8

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
  const [model, setModel] = useState('distilbert')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(loadHistory)
  const resultRef = useRef(null)

  const available = health?.models ?? {}
  const words = countWords(text)
  const tooShort = words > 0 && words < MIN_WORDS

  // If the neural model is not trained yet, fall back to the baseline.
  useEffect(() => {
    if (health?.models && !health.models.distilbert && health.models.baseline) setModel('baseline')
  }, [health])

  async function run(articleText = text, modelId = model) {
    if (countWords(articleText) < MIN_WORDS || loading) return
    setLoading(true)
    setError('')
    try {
      const prediction = await classify(articleText, modelId)
      setResult(prediction)
      const entry = {
        id: Date.now(),
        text: articleText,
        snippet: articleText.trim().slice(0, 140),
        category: prediction.category,
        confidence: prediction.confidence,
        model: prediction.model,
      }
      const next = [entry, ...history.filter((item) => item.text !== articleText || item.model !== modelId)].slice(0, HISTORY_SIZE)
      setHistory(next)
      saveHistory(next)
      // On phones the result is below the text box, so bring it into view.
      if (window.matchMedia('(max-width: 1023px)').matches) {
        requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }
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
    // Re-run straight away so the two models are easy to compare.
    if (result && words >= MIN_WORDS) run(text, id)
  }

  return (
    <div className="space-y-10">
      <section className="max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Which section does this story belong in?
        </h1>
        <p className="mt-3 text-stone-600 text-pretty">
          Paste any news article and a fine-tuned DistilBERT neural network will sort it into business,
          entertainment, politics, sport or tech, and tell you how sure it is.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        {/* Input */}
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="article" className="text-sm font-semibold">Article text</label>
            <span className={`text-xs tabular-nums ${tooShort ? 'text-amber-700' : 'text-stone-500'}`}>
              {words} {words === 1 ? 'word' : 'words'}{tooShort && ` · need at least ${MIN_WORDS}`}
            </span>
          </div>
          <textarea
            id="article"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) run()
            }}
            placeholder="Paste the headline and body of a news article here…"
            className="h-72 w-full resize-y rounded-xl border border-stone-200 bg-stone-50/60 p-4 text-[15px] leading-relaxed placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none sm:h-80"
          />

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Try a sample</p>
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
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 transition hover:border-stone-400 hover:text-stone-900 disabled:opacity-50"
                  >
                    <span aria-hidden="true">{meta.emoji}</span> {meta.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-stone-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Model</legend>
              <div className="inline-flex rounded-lg bg-stone-100 p-1">
                {MODELS.map((option) => {
                  const ready = available[option.id] !== false
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => switchModel(option.id)}
                      disabled={!ready || loading}
                      aria-pressed={model === option.id}
                      title={ready ? option.detail : 'Not trained yet'}
                      className={`rounded-md px-3 py-1.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        model === option.id ? 'bg-white font-semibold shadow-sm' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {option.name}
                      <span className="block text-[11px] font-normal text-stone-500">{option.detail}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <div className="flex gap-2">
              {text && (
                <button
                  type="button"
                  onClick={() => { setText(''); setResult(null); setError('') }}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-100"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => run()}
                disabled={words < MIN_WORDS || loading}
                className="flex-1 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 sm:flex-none"
              >
                {loading ? 'Classifying…' : 'Classify article'}
              </button>
            </div>
          </div>
          <p className="mt-3 hidden text-right text-xs text-stone-400 sm:block">Tip: press ⌘/Ctrl + Enter to classify</p>
        </section>

        {/* Result */}
        <section ref={resultRef} aria-live="polite" className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          {error ? (
            <ErrorState message={error} onRetry={words >= MIN_WORDS ? () => run() : null} />
          ) : loading ? (
            <LoadingState />
          ) : result ? (
            <Result result={result} />
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

function Result({ result }) {
  const meta = category(result.category)
  const ranked = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1])
  const unsure = result.confidence < 0.6

  return (
    <div className="animate-rise">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Predicted category</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-lg font-semibold ring-1 ${meta.soft}`}>
          <span aria-hidden="true">{meta.emoji}</span> {meta.name}
        </span>
        <div className="text-right">
          <div className="font-serif text-4xl font-semibold tabular-nums">{percent(result.confidence)}</div>
          <div className="text-xs text-stone-500">confidence</div>
        </div>
      </div>

      {unsure && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          The model is not very sure. The article may cover more than one topic.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {ranked.map(([label, score]) => {
          const item = category(label)
          return (
            <div key={label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className={label === result.category ? 'font-semibold' : 'text-stone-600'}>{item.name}</span>
                <span className="tabular-nums text-stone-600">{percent(score)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-label={item.name} aria-valuenow={Math.round(score * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${label === result.category ? item.bar : 'bg-stone-300'}`}
                  style={{ width: `${Math.max(score * 100, 0.5)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {result.key_terms.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Words linked to {meta.name.toLowerCase()}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.key_terms.map((term) => (
              <span key={term} className="rounded-md bg-stone-100 px-2 py-1 text-sm text-stone-700">{term}</span>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-stone-400">Words in your text that the TF-IDF model weighs most towards this category.</p>
        </div>
      )}

      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-stone-100 pt-4 text-sm">
        <div>
          <dt className="text-xs text-stone-500">Model</dt>
          <dd className="font-medium">{result.model === 'distilbert' ? 'DistilBERT' : 'TF-IDF'}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Words</dt>
          <dd className="font-medium tabular-nums">{result.word_count.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Time</dt>
          <dd className="font-medium tabular-nums">{Math.round(result.elapsed_ms)} ms</dd>
        </div>
      </dl>
      {result.truncated && (
        <p className="mt-3 text-xs text-stone-500">
          Long article: DistilBERT read the first {result.max_tokens} tokens (about {Math.round(result.max_tokens * 0.75)} words), which include the headline and key facts.
        </p>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="grid min-h-72 place-items-center text-center">
      <div>
        <div className="mx-auto flex w-fit items-end gap-1.5" aria-hidden="true">
          {['bg-sky-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-emerald-500', 'bg-violet-500'].map((color, i) => (
            <span key={color} className={`w-3 rounded-full ${color} opacity-80`} style={{ height: `${24 + ((i * 17) % 40)}px` }} />
          ))}
        </div>
        <p className="mt-5 font-medium">No article classified yet</p>
        <p className="mt-1 text-sm text-stone-500">Paste an article or try a sample to see the prediction here.</p>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-72 animate-pulse" aria-label="Classifying">
      <div className="h-3 w-32 rounded bg-stone-200" />
      <div className="mt-4 flex justify-between">
        <div className="h-10 w-40 rounded-full bg-stone-200" />
        <div className="h-10 w-24 rounded bg-stone-200" />
      </div>
      <div className="mt-8 space-y-4">
        {[90, 60, 40, 25, 15].map((width) => (
          <div key={width}>
            <div className="mb-1.5 h-3 w-20 rounded bg-stone-200" />
            <div className="h-2.5 rounded-full bg-stone-100"><div className="h-full rounded-full bg-stone-200" style={{ width: `${width}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="grid min-h-72 place-items-center text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-rose-50 text-lg text-rose-600 ring-1 ring-rose-200" aria-hidden="true">!</div>
        <p className="mt-4 font-medium">Something went wrong</p>
        <p className="mt-1 break-words text-sm text-stone-600">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100">
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

function History({ items, onOpen, onClear }) {
  if (items.length === 0) return null
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">Recent predictions</h2>
        <button type="button" onClick={onClear} className="text-sm text-stone-500 hover:text-stone-900">Clear history</button>
      </div>
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {items.map((item) => {
          const meta = category(item.category)
          return (
            <li key={item.id}>
              <button type="button" onClick={() => onOpen(item)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-stone-50 sm:gap-4">
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.soft}`}>{meta.name}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-stone-700">{item.snippet}</span>
                <span className="hidden shrink-0 text-xs text-stone-400 sm:inline">{item.model === 'distilbert' ? 'DistilBERT' : 'TF-IDF'}</span>
                <span className="shrink-0 text-sm font-medium tabular-nums">{percent(item.confidence, 0)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
