// Display settings for each category. The category names themselves come
// from the backend (/health), which reads them from the trained model.
export const CATEGORIES = {
  business: { name: 'Business', short: 'Business', emoji: '💼', bar: 'bg-sky-600', soft: 'bg-sky-50 text-sky-800 ring-sky-200', hex: '#0284c7' },
  entertainment: { name: 'Entertainment', short: 'Entmt.', emoji: '🎬', bar: 'bg-fuchsia-600', soft: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200', hex: '#c026d3' },
  politics: { name: 'Politics', short: 'Politics', emoji: '🏛️', bar: 'bg-rose-600', soft: 'bg-rose-50 text-rose-800 ring-rose-200', hex: '#e11d48' },
  sport: { name: 'Sport', short: 'Sport', emoji: '⚽', bar: 'bg-emerald-600', soft: 'bg-emerald-50 text-emerald-800 ring-emerald-200', hex: '#059669' },
  tech: { name: 'Tech', short: 'Tech', emoji: '💻', bar: 'bg-violet-600', soft: 'bg-violet-50 text-violet-800 ring-violet-200', hex: '#7c3aed' },
}

const FALLBACK = { emoji: '📰', bar: 'bg-stone-600', soft: 'bg-stone-100 text-stone-800 ring-stone-200', hex: '#57534e' }

export function category(label) {
  const name = label.charAt(0).toUpperCase() + label.slice(1)
  return CATEGORIES[label] ?? { ...FALLBACK, name, short: name }
}

export const MODELS = [
  { id: 'distilbert', name: 'DistilBERT', detail: 'Neural network' },
  { id: 'baseline', name: 'TF-IDF + LogReg', detail: 'Classical baseline' },
]

export const percent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`
