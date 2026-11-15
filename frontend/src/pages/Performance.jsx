import { useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getMetrics } from '../api.js'
import { category, percent } from '../categories.js'

const ORDER = ['combined', 'distilbert', 'baseline']
const SHORT = { combined: 'Combined', distilbert: 'DistilBERT', baseline: 'TF-IDF + LogReg' }
const KIND = { combined: 'Used by the app', distilbert: 'Neural network', baseline: 'Classical baseline' }

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
      <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="font-medium">Could not load the results</p>
        <p className="mt-1 text-sm text-stone-600">{error}</p>
        <button type="button" onClick={load} className="mt-4 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100">Try again</button>
      </div>
    )
  }
  if (!metrics) {
    return (
      <div className="grid animate-pulse gap-4 sm:grid-cols-2" aria-label="Loading results">
        {[0, 1].map((i) => <div key={i} className="h-44 rounded-2xl bg-stone-200/70" />)}
        <div className="h-72 rounded-2xl bg-stone-200/70 sm:col-span-2" />
      </div>
    )
  }

  const models = ORDER.filter((id) => metrics[id])
  const labels = metrics[models[0]].labels

  return (
    <div className="space-y-12">
      <section className="max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Model performance</h1>
        <p className="mt-3 text-stone-600 text-pretty">
          All models were tested on {metrics[models[0]].test_size} BBC articles they never saw during training.
          The DistilBERT neural network is compared with a classical TF-IDF + Logistic Regression baseline, and with the
          two combined (their probabilities averaged), which is what the app uses by default.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {models.map((id) => <SummaryCard key={id} id={id} data={metrics[id]} />)}
      </section>

      <section>
        <SectionTitle title="F1 score by category" note="F1 combines precision (when the model says “sport”, how often it is right) and recall (of the real sport articles, how many it found). 100% is perfect. Hover a score to see precision and recall." />
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500">
                <th className="px-4 py-3 font-semibold">Category</th>
                {models.map((id) => (
                  <th key={id} className="px-4 py-3 text-right font-semibold text-stone-700">{SHORT[id]}</th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Articles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {labels.map((label) => (
                <tr key={label}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium">
                      <span className={`size-2.5 rounded-full ${category(label).bar}`} />
                      {category(label).name}
                    </span>
                  </td>
                  {models.map((id) => {
                    const row = metrics[id].per_class[label]
                    return (
                      <td key={id} title={`Precision ${percent(row.precision)} · Recall ${percent(row.recall)}`} className="px-4 py-3 text-right font-semibold tabular-nums">
                        {percent(row.f1)}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-right tabular-nums text-stone-600">{metrics[models[0]].per_class[label].support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle title="Confusion matrices" note="Each row is the real category and each column is what the model predicted. Numbers on the diagonal are correct; anything off the diagonal is a mistake." />
        <div className="grid gap-4 lg:grid-cols-2">
          {models.map((id) => <ConfusionMatrix key={id} title={SHORT[id]} data={metrics[id]} />)}
        </div>
      </section>

      {metrics.distilbert?.training && <TrainingChart training={metrics.distilbert.training} />}
    </div>
  )
}

function SectionTitle({ title, note }) {
  return (
    <div className="mb-4 max-w-3xl">
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      {note && <p className="mt-1 text-sm text-stone-600 text-pretty">{note}</p>}
    </div>
  )
}

function SummaryCard({ id, data }) {
  const correct = data.confusion_matrix.reduce((sum, row, i) => sum + row[i], 0)
  const neural = id === 'combined'
  return (
    <div className={`rounded-2xl p-6 shadow-sm ${neural ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${neural ? 'text-stone-400' : 'text-stone-500'}`}>
            {KIND[id]}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{data.title}</h3>
        </div>
      </div>
      <div className="mt-6 flex items-end gap-8">
        <div>
          <div className="font-serif text-5xl font-semibold tabular-nums">{percent(data.accuracy)}</div>
          <div className={`mt-1 text-sm ${neural ? 'text-stone-400' : 'text-stone-500'}`}>accuracy</div>
        </div>
        <dl className={`grid gap-1 pb-1 text-sm ${neural ? 'text-stone-300' : 'text-stone-600'}`}>
          <div><dt className="inline">Macro F1 </dt><dd className="inline font-semibold tabular-nums">{percent(data.macro_f1)}</dd></div>
          <div><dt className="inline">Correct </dt><dd className="inline font-semibold tabular-nums">{correct} / {data.test_size}</dd></div>
        </dl>
      </div>
    </div>
  )
}

function ConfusionMatrix({ title, data }) {
  const { labels, confusion_matrix: matrix } = data
  return (
    <figure className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <figcaption className="mb-4 font-semibold">{title}</figcaption>
      <div className="overflow-x-auto">
        <div className="grid min-w-[380px] gap-1" style={{ gridTemplateColumns: `6.5rem repeat(${labels.length}, minmax(0, 1fr))` }}>
          <div className="self-end pb-1 text-[10px] uppercase tracking-wider text-stone-400">Real ↓ / Predicted →</div>
          {labels.map((label) => (
            <div key={label} title={category(label).name} className="pb-1 text-center text-xs font-medium text-stone-600">{category(label).short}</div>
          ))}
          {matrix.map((row, i) => (
            <Row key={labels[i]} label={labels[i]} row={row} index={i} labels={labels} />
          ))}
        </div>
      </div>
    </figure>
  )
}

function Row({ label, row, index, labels }) {
  const total = row.reduce((sum, count) => sum + count, 0) || 1
  return (
    <>
      <div className="flex items-center text-xs font-medium text-stone-600">{category(label).name}</div>
      {row.map((count, j) => {
        const correct = index === j
        // Shade by the share of this real category, so small and large categories compare fairly.
        const strength = count / total
        const style = correct
          ? { backgroundColor: `rgba(28, 25, 23, ${0.12 + strength * 0.88})`, color: strength > 0.45 ? 'white' : '#1c1917' }
          : count > 0
            ? { backgroundColor: '#fee2e2', color: '#9f1239' }
            : {}
        return (
          <div
            key={j}
            style={style}
            title={`Real ${category(label).name}, predicted ${category(labels[j]).name}: ${count}`}
            className={`grid aspect-square place-items-center rounded-md text-sm font-semibold tabular-nums ${!correct && count === 0 ? 'bg-stone-50 text-stone-300' : ''}`}
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
        title="How DistilBERT learned"
        note={`Fine-tuned from ${training.base_model} for ${training.epochs} epochs (batch size ${training.batch_size}, learning rate ${training.learning_rate.toExponential()}, max ${training.max_length} tokens) on ${training.device.toUpperCase()}. The loss falls as the network learns; the epoch with the best validation accuracy was kept.`}
      />
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="epoch" tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={{ stroke: '#d6d3d1' }} />
              <YAxis yAxisId="acc" domain={[80, 100]} unit="%" tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="loss" orientation="right" tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line yAxisId="acc" type="monotone" dataKey="Validation accuracy" stroke="#1c1917" strokeWidth={2.5} dot={{ r: 4 }} unit="%" />
              <Line yAxisId="loss" type="monotone" dataKey="Training loss" stroke="#a8a29e" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
