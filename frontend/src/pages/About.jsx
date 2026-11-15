import { Link } from 'react-router-dom'
import { CATEGORIES } from '../categories.js'

const STEPS = [
  {
    emoji: '✂️',
    color: 'bg-sky-300',
    title: 'Chop it into tokens',
    body: 'The text is split into word pieces from a 30,000-piece vocabulary. Unknown words get split up, so “smartwatch” becomes “smart” + “##watch”.',
    demo: ['arsenal', 'beat', 'chelsea', '2', '-', '1', 'smart', '##watch'],
  },
  {
    emoji: '🧠',
    color: 'bg-violet-300',
    title: 'DistilBERT reads it',
    body: 'A 6-layer Transformer with 66 million parameters reads every token at once. Self-attention lets each word look at all the others, so “bank” next to “river” ≠ “bank” next to “interest rates”.',
  },
  {
    emoji: '🏆',
    color: 'bg-lime-300',
    title: 'Pick a winner',
    body: 'A final layer gives one score per category. Softmax turns the scores into probabilities that add up to 100%, and the biggest one wins.',
  },
]

export default function About() {
  return (
    <div className="space-y-14">
      <section className="max-w-3xl">
        <p className="label mb-3">🧠 Under the hood</p>
        <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">How does it work?</h1>
        <div className="card mt-6 -rotate-1 bg-sun p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/60">The problem statement</p>
          <p className="mt-1 font-display text-xl leading-snug font-bold sm:text-2xl">
            “Automatically classify news articles into categories such as sports, politics, business and technology.”
          </p>
        </div>
        <p className="mt-6 text-lg text-ink/70 text-pretty">
          Newsrooms get thousands of stories a day. Sorting them by hand is slow and boring, so we trained a neural network
          to do it in a fraction of a second.
        </p>
      </section>

      <section>
        <h2 className="mb-6 font-display text-3xl font-extrabold tracking-tight">From article to answer in 3 steps</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card relative overflow-hidden" style={{ transform: `rotate(${[-1, 0.8, -0.6][i]}deg)` }}>
              <div className={`flex items-center gap-3 border-b-2 border-ink px-5 py-3 ${step.color}`}>
                <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-white font-display text-lg font-extrabold">{i + 1}</span>
                <h3 className="font-display text-lg font-extrabold">{step.title}</h3>
                <span className="ml-auto text-3xl" aria-hidden="true">{step.emoji}</span>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-ink/80">{step.body}</p>
                {step.demo && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {step.demo.map((token, j) => (
                      <code key={j} className="rounded border-2 border-ink bg-paper px-1.5 py-0.5 text-xs font-bold">{token}</code>
                    ))}
                  </div>
                )}
                {i === 2 && <MiniBars />}
              </div>
            </li>
          ))}
        </ol>
        <Pipeline />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card emoji="📚" title="What it learned from">
          <p>Two datasets, <b>12,104 articles</b> in total:</p>
          <ul className="mt-3 space-y-3">
            <li className="rounded-xl border-2 border-ink/15 bg-paper/60 p-3">
              <b>📻 BBC News</b> (Greene &amp; Cunningham, 2006)
              <span className="block text-ink/70">2,104 full articles from 2004–05</span>
            </li>
            <li className="rounded-xl border-2 border-ink/15 bg-paper/60 p-3">
              <b>📱 HuffPost News Category</b> (Misra, 2022)
              <span className="block text-ink/70">10,000 headlines + summaries from 2012–22, so it knows modern topics</span>
            </li>
          </ul>
          <p className="mt-3">Each was split 80% to learn from, 10% to pick the best version, 10% for the final exam.</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.entries(CATEGORIES).map(([key, item]) => (
              <span key={key} className={`chip py-0.5 text-xs ${item.tint}`}>{item.emoji} {item.name}</span>
            ))}
          </div>
        </Card>
        <Card emoji="🥊" title="The contenders">
          <div className="space-y-3">
            <p>
              <b>🧠 DistilBERT</b>: a smaller, faster version of Google’s BERT. Pre-trained on Wikipedia and books, then
              fine-tuned on our news. Understands word order and context.
            </p>
            <p>
              <b>🔢 TF-IDF + Logistic Regression</b>: the old-school baseline. Scores how distinctive each word is and learns
              a weight per word. Fast and surprisingly strong.
            </p>
            <p>
              <b>🤝 Combined</b>: averages the two. DistilBERT brings brains, TF-IDF keeps its confidence honest, and this is
              what the app uses.
            </p>
          </div>
          <Link to="/performance" className="btn mt-5 bg-sun">See who wins →</Link>
        </Card>
        <Card emoji="⚠️" title="What it’s not great at">
          <ul className="space-y-2">
            <li>🗓️ Newest training news is from 2022, so newer events and names may confuse it.</li>
            <li>🎭 One label per article, even when a story is about two things (it shows “also related” to help).</li>
            <li>🧪 Only five categories, so a science or health story gets squeezed into the closest one.</li>
            <li>📏 DistilBERT reads only the first 512 tokens (~380 words) of very long articles.</li>
          </ul>
        </Card>
        <Card emoji="🛠️" title="Built with">
          <div className="flex flex-wrap gap-2">
            {['🐍 Python', '🔥 PyTorch', '🤗 Transformers', '📐 scikit-learn', '⚡ FastAPI', '⚛️ React', '🌬️ Tailwind CSS', '📈 Recharts'].map((tool) => (
              <span key={tool} className="chip bg-white">{tool}</span>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}

function Card({ emoji, title, children }) {
  return (
    <div className="card p-6 text-sm leading-relaxed">
      <h3 className="mb-4 font-display text-xl font-extrabold">
        <span aria-hidden="true">{emoji}</span> {title}
      </h3>
      {children}
    </div>
  )
}

function MiniBars() {
  const bars = [
    ['⚽', 'Sport', 94, 'bg-lime-400'],
    ['💼', 'Business', 3, 'bg-ink/25'],
    ['🏛️', 'Politics', 2, 'bg-ink/25'],
  ]
  return (
    <div className="mt-4 space-y-1.5" aria-hidden="true">
      {bars.map(([emoji, name, value, color]) => (
        <div key={name} className="flex items-center gap-2 text-xs font-bold">
          <span className="w-5">{emoji}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-paper">
            <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
          </div>
          <span className="w-8 text-right tabular-nums">{value}%</span>
        </div>
      ))}
    </div>
  )
}

function Pipeline() {
  const nodes = [
    ['📰', 'Article'],
    ['✂️', 'Tokenizer'],
    ['🧠', 'DistilBERT'],
    ['📊', 'Softmax'],
    ['🏷️', 'Category'],
  ]
  return (
    <div className="mt-8 overflow-x-auto pb-2">
      <ol className="mx-auto flex w-max items-center gap-2 text-sm" aria-label="Pipeline">
        {nodes.map(([emoji, node], i) => (
          <li key={node} className="flex items-center gap-2">
            <span
              className={`rounded-xl border-2 border-ink px-3 py-2 font-bold shadow-[3px_3px_0_0_var(--color-ink)] ${
                i === 2 ? 'bg-ink text-white' : 'bg-white'
              }`}
            >
              {emoji} {node}
            </span>
            {i < nodes.length - 1 && <span className="font-display text-xl font-extrabold" aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>
    </div>
  )
}
