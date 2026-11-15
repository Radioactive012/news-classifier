import { useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getMetrics } from '../api.js'
import { category, percent } from '../categories.js'

const ORDER = ['combined', 'distilbert', 'baseline']
const SHORT = { combined: 'Combined', distilbert: 'DistilBERT', baseline: 'TF-IDF' }
const SOURCES = { bbc: '📻 BBC 2004–05', huffpost: '📱 HuffPost 2012–22' }
const LOOK = {
  combined: { kind: '🏆 Used by the app', bg: 'bg-sun' },
  distilbert: { kind: '🧠 Neural network', bg: 'bg-violet-200' },
  baseline: { kind: '🔢 Classic baseline', bg: 'bg-white' },
}

// Version 1 was trained on BBC articles only. These are its scores on the same
// HuffPost test set (from evaluating the backed-up v1 models, see reports/REPORT.md).
const VERSION_1_MODERN = { distilbert: 0.681, baseline: 0.487 }

export default function Performance() {
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    setMetrics(null)
    getMetrics().then(setMetrics).catch((err) => setError(err.message))
  }
  useEffect(load, [])

  if (error) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <span className="text-5xl" aria-hidden="true">😵</span>
        <p className="mt-3 font-display text-xl font-extrabold">Couldn’t load the results</p>
        <p className="mt-1 text-sm text-ink/70">{error}</p>
        <button type="button" onClick={load} className="btn mt-5 bg-white">Try again</button>
      </div>
    )
  }
  if (!metrics) {
    return (
      <div className="grid animate-pulse gap-5 md:grid-cols-3" aria-label="Loading results">
        {[0, 1, 2].map((i) => <div key={i} className="h-60 rounded-2xl border-2 border-ink/10 bg-white/60" />)}
      </div>
    )
  }

  const models = ORDER.filter((id) => metrics[id])
  const labels = metrics[models[0]].labels

  return (
    <div className="space-y-14">
      <section className="max-w-2xl">
        <p className="label mb-3">📊 The report card</p>
        <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">How good is the AI?</h1>
        <p className="mt-4 text-lg text-ink/70 text-pretty">
          Every model sat the same exam: <b>{metrics[models[0]].test_size.toLocaleString()} articles it had never seen</b>,
          from 2004–05 BBC News and 2012–22 HuffPost.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {models.map((id, i) => <SummaryCard key={id} id={id} data={metrics[id]} rank={i} />)}
      </section>

      {metrics.distilbert?.by_source?.huffpost && <GlowUp metrics={metrics} />}

      <section>
        <SectionTitle
          emoji="🎯"
          title="Score by category"
          note="F1 combines precision (when it says “sport”, is it right?) and recall (did it find all the sport stories?). Hover a score to see both."
        />
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink/60">Category</th>
                {models.map((id) => (
                  <th key={id} className="px-4 py-3 text-right font-display font-extrabold">{SHORT[id]}</th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-ink/60">Articles</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-ink/10">
              {labels.map((label) => {
                const best = Math.max(...models.map((id) => metrics[id].per_class[label].f1))
                return (
                  <tr key={label} className="hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <span className={`chip py-0.5 text-xs ${category(label).tint}`}>
                        {category(label).emoji} {category(label).name}
                      </span>
                    </td>
                    {models.map((id) => {
                      const row = metrics[id].per_class[label]
                      return (
                        <td
                          key={id}
                          title={`Precision ${percent(row.precision)} · Recall ${percent(row.recall)}`}
                          className="px-4 py-3 text-right font-bold tabular-nums"
                        >
                          <span className={row.f1 === best ? 'rounded bg-sun px-1.5 py-0.5' : ''}>{percent(row.f1)}</span>
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right tabular-nums text-ink/60">{metrics[models[0]].per_class[label].support}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle
          emoji="🧩"
          title="Where does it get confused?"
          note="Rows are the real category, columns are what the model guessed. The diagonal is correct; pink squares are mistakes."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {models.map((id) => <ConfusionMatrix key={id} title={SHORT[id]} data={metrics[id]} />)}
        </div>
      </section>

      {metrics.distilbert?.training && <TrainingChart training={metrics.distilbert.training} />}
    </div>
  )
}

function SectionTitle({ emoji, title, note }) {
  return (
    <div className="mb-5 max-w-3xl">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">
        <span aria-hidden="true">{emoji}</span> {title}
      </h2>
      {note && <p className="mt-1.5 text-ink/70 text-pretty">{note}</p>}
    </div>
  )
}

function SummaryCard({ id, data, rank }) {
  const correct = data.confusion_matrix.reduce((sum, row, i) => sum + row[i], 0)
  const look = LOOK[id]
  return (
    <div className={`card relative p-5 ${look.bg}`} style={{ transform: `rotate(${[-1, 0.6, -0.4][rank] ?? 0}deg)` }}>
      {rank === 0 && (
        <span className="absolute -right-3 -top-4 rotate-12 rounded-full border-2 border-ink bg-red-500 px-3 py-1 text-xs font-extrabold uppercase text-white shadow-[2px_2px_0_0_var(--color-ink)]">
          Best
        </span>
      )}
      <p className="text-xs font-bold uppercase tracking-widest text-ink/60">{look.kind}</p>
      <h3 className="mt-1 font-display text-lg leading-tight font-extrabold">{data.title}</h3>
      <div className="mt-4 font-display text-6xl leading-none font-extrabold tabular-nums">{percent(data.accuracy)}</div>
      <p className="mt-1 text-sm font-semibold text-ink/60">
        accuracy · {correct.toLocaleString()} / {data.test_size.toLocaleString()} right
      </p>
      {data.by_source && Object.keys(data.by_source).length > 0 && (
        <dl className="mt-5 space-y-2.5 border-t-2 border-ink/15 pt-4 text-sm">
          {Object.entries(data.by_source).map(([source, result]) => (
            <div key={source}>
              <div className="flex justify-between">
                <dt className="font-semibold">{SOURCES[source] ?? source}</dt>
                <dd className="font-bold tabular-nums">{percent(result.accuracy)}</dd>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-white">
                <div className="animate-grow h-full bg-ink" style={{ width: `${result.accuracy * 100}%` }} />
              </div>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

// Before/after: what adding modern training data did to accuracy on modern news.
function GlowUp({ metrics }) {
  const rows = [
    { id: 'distilbert', label: '🧠 DistilBERT' },
    { id: 'baseline', label: '🔢 TF-IDF' },
  ].filter((row) => metrics[row.id]?.by_source?.huffpost)
  return (
    <section className="card overflow-hidden">
      <div className="grid md:grid-cols-[1fr_1.4fr]">
        <div className="border-b-2 border-ink bg-ink p-6 text-white md:border-b-0 md:border-r-2">
          <p className="text-xs font-bold uppercase tracking-widest text-sun">✨ The glow-up</p>
          <h2 className="mt-2 font-display text-3xl leading-tight font-extrabold">Old news made the AI clueless about today.</h2>
          <p className="mt-3 text-white/75 text-pretty">
            Version 1 only studied BBC articles from 2004. It had never heard of Instagram or Netflix. Adding 10,000 modern
            HuffPost stories fixed that.
          </p>
        </div>
        <div className="space-y-5 p-6">
          <p className="label">Accuracy on modern (2012–22) news</p>
          {rows.map(({ id, label }) => {
            const before = VERSION_1_MODERN[id]
            const after = metrics[id].by_source.huffpost.accuracy
            return (
              <div key={id}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-bold">{label}</span>
                  <span className="font-display text-xl font-extrabold tabular-nums">
                    <span className="text-ink/40 line-through decoration-2">{percent(before, 0)}</span>{' '}
                    → <span className="rounded bg-lime-300 px-1.5">{percent(after, 0)}</span>
                  </span>
                </div>
                <div className="relative h-5 overflow-hidden rounded-full border-2 border-ink bg-paper">
                  <div className="animate-grow absolute inset-y-0 left-0 bg-lime-400" style={{ width: `${after * 100}%` }} />
                  <div className="absolute inset-y-0 left-0 border-r-2 border-ink bg-red-300" style={{ width: `${before * 100}%` }} />
                </div>
              </div>
            )
          })}
          <p className="text-xs text-ink/60">
            <span className="mr-1 inline-block size-2.5 rounded-sm border border-ink bg-red-300 align-middle" /> before (BBC only)
            <span className="ml-3 mr-1 inline-block size-2.5 rounded-sm border border-ink bg-lime-400 align-middle" /> after (BBC + HuffPost)
          </p>
        </div>
      </div>
    </section>
  )
}

function ConfusionMatrix({ title, data }) {
  const { labels, confusion_matrix: matrix } = data
  return (
    <figure className="card p-4">
      <figcaption className="mb-3 font-display text-lg font-extrabold">{title}</figcaption>
      <div className="overflow-x-auto">
        <div className="grid min-w-[300px] gap-1" style={{ gridTemplateColumns: `2rem repeat(${labels.length}, minmax(0, 1fr))` }}>
          <div />
          {labels.map((label) => (
            <div key={label} title={category(label).name} className="pb-1 text-center text-lg" aria-label={category(label).name}>
              {category(label).emoji}
            </div>
          ))}
          {matrix.map((row, i) => (
            <Row key={labels[i]} label={labels[i]} row={row} index={i} labels={labels} />
          ))}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink/50">Real ↓ · Guessed →</p>
    </figure>
  )
}

function Row({ label, row, index, labels }) {
  const total = row.reduce((sum, count) => sum + count, 0) || 1
  return (
    <>
      <div className="grid place-items-center text-lg" title={category(label).name}>{category(label).emoji}</div>
      {row.map((count, j) => {
        const correct = index === j
        // Shade by the share of this real category, so small and large categories compare fairly.
        const strength = count / total
        const style = correct
          ? { backgroundColor: `rgba(28, 25, 23, ${0.15 + strength * 0.85})`, color: strength > 0.45 ? 'white' : '#1c1917' }
          : count > 0
            ? { backgroundColor: `rgba(244, 114, 182, ${0.25 + Math.min(strength * 6, 0.75)})` }
            : {}
        return (
          <div
            key={j}
            style={style}
            title={`Real ${category(label).name}, guessed ${category(labels[j]).name}: ${count}`}
            className={`grid aspect-square place-items-center rounded-md text-xs font-bold tabular-nums ${
              !correct && count === 0 ? 'bg-ink/5 text-ink/25' : ''
            }`}
          >
            {count}
          </div>
        )
      })}
    </>
  )
}

function TrainingChart({ training }) {
  const points = training.history.map((h) => ({
    epoch: `Epoch ${h.epoch}`,
    'Validation accuracy': +(h.val_accuracy * 100).toFixed(2),
    'Training loss': +h.train_loss.toFixed(4),
  }))
  return (
    <section>
      <SectionTitle
        emoji="📈"
        title="Watch it learn"
        note={`DistilBERT read every training article ${training.epochs} times (each pass is an “epoch”) on an Apple ${training.device.toUpperCase()} GPU. Loss (how wrong it is) drops while accuracy climbs, and we kept the best epoch.`}
      />
      <div className="card p-4 sm:p-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="epoch" tick={{ fontSize: 12, fill: '#57534e', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#1c1917', strokeWidth: 2 }} />
              <YAxis yAxisId="acc" domain={[80, 100]} unit="%" tick={{ fontSize: 12, fill: '#57534e' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="loss" orientation="right" tick={{ fontSize: 12, fill: '#57534e' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #1c1917', fontSize: 13, fontWeight: 600 }} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Line yAxisId="acc" type="monotone" dataKey="Validation accuracy" stroke="#1c1917" strokeWidth={3} dot={{ r: 6, fill: '#fde047', stroke: '#1c1917', strokeWidth: 2 }} unit="%" />
              <Line yAxisId="loss" type="monotone" dataKey="Training loss" stroke="#f472b6" strokeWidth={3} strokeDasharray="6 5" dot={{ r: 5, fill: '#f472b6', stroke: '#1c1917', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
