// Display settings for each category. The category names themselves come
// from the backend (/health), which reads them from the trained model.
// All class names are written out in full so Tailwind can find them.
export const CATEGORIES = {
  business: { name: 'Business', short: 'Business', emoji: '💼', bg: 'bg-sky-400', tint: 'bg-sky-100', hex: '#38bdf8' },
  entertainment: { name: 'Entertainment', short: 'Entmt.', emoji: '🎬', bg: 'bg-pink-400', tint: 'bg-pink-100', hex: '#f472b6' },
  politics: { name: 'Politics', short: 'Politics', emoji: '🏛️', bg: 'bg-red-400', tint: 'bg-red-100', hex: '#f87171' },
  sport: { name: 'Sport', short: 'Sport', emoji: '⚽', bg: 'bg-lime-400', tint: 'bg-lime-100', hex: '#a3e635' },
  tech: { name: 'Tech', short: 'Tech', emoji: '💻', bg: 'bg-violet-400', tint: 'bg-violet-100', hex: '#a78bfa' },
}

const FALLBACK = { emoji: '📰', bg: 'bg-stone-300', tint: 'bg-stone-100', hex: '#d6d3d1' }

export function category(label) {
  const name = label.charAt(0).toUpperCase() + label.slice(1)
  return CATEGORIES[label] ?? { ...FALLBACK, name, short: name }
}

export const MODELS = [
  { id: 'combined', name: 'Combined', detail: 'Recommended', emoji: '🤝' },
  { id: 'distilbert', name: 'DistilBERT', detail: 'Neural network', emoji: '🧠' },
  { id: 'baseline', name: 'TF-IDF', detail: 'Word counting', emoji: '🔢' },
]

export const MODEL_SHORT = { combined: 'Combined', distilbert: 'DistilBERT', baseline: 'TF-IDF' }

export const percent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`
