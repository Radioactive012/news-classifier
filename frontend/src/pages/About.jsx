import { Link } from 'react-router-dom'
import { CATEGORIES } from '../categories.js'

const STEPS = [
  {
    title: 'Tokenise the article',
    body: 'The text is split into word pieces (“tokens”) from a 30,000-piece vocabulary, so even unknown words like “smartwatch” become “smart” + “##watch”. The first 512 tokens (about 380 words) are kept.',
  },
  {
    title: 'Read it with DistilBERT',
    body: 'A 6-layer Transformer neural network with 66 million parameters reads all tokens at once. Self-attention lets every word look at every other word, so “bank” means something different next to “river” and next to “interest rates”.',
  },
  {
    title: 'Pick the category',
    body: 'A final classification layer turns the network’s understanding into one score per category. Softmax converts the scores into probabilities that add up to 100%, and the highest one is the answer.',
  },
]

export default function About() {
  return (
    <div className="space-y-14">
      <section className="max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h1>
        <p className="mt-4 text-lg text-stone-600 text-pretty">
          <strong className="font-semibold text-stone-900">Problem statement:</strong> automatically classify news
          articles into categories such as sports, politics, business and technology.
        </p>
        <p className="mt-3 text-stone-600 text-pretty">
          Newsrooms, aggregators and search engines receive thousands of stories a day. Sorting them by hand is slow,
          so this project trains a neural network to do it in a fraction of a second.
        </p>
      </section>

      <section>
        <h2 className="mb-5 font-serif text-2xl font-semibold">From article to category in three steps</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <span className="grid size-9 place-items-center rounded-full bg-stone-900 font-serif text-lg font-semibold text-white">{i + 1}</span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.body}</p>
            </li>
          ))}
        </ol>
        <Pipeline />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="The dataset">
          <p>
            Two datasets, 12,104 articles in total, in five categories:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <strong>BBC News</strong> (Greene &amp; Cunningham, 2006): 2,104 full articles from 2004–05, after removing
              duplicates.
            </li>
            <li>
              <strong>HuffPost News Category</strong> (Misra, 2022): 10,000 headlines with a short summary from 2012–22,
              2,000 per category, so the model also knows modern topics.
            </li>
          </ul>
          <p className="mt-2">Each is split 80% for training, 10% for validation (choosing the best epoch) and 10% for the final test.</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.entries(CATEGORIES).map(([key, item]) => (
              <span key={key} className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${item.soft}`}>{item.emoji} {item.name}</span>
            ))}
          </div>
        </Card>
        <Card title="Two models, compared">
          <p>
            <strong>DistilBERT</strong> is a smaller, faster version of Google’s BERT, pre-trained on Wikipedia and
            books, then fine-tuned here for 3 epochs on the news articles. It understands word order and context.
          </p>
          <p className="mt-3">
            <strong>TF-IDF + Logistic Regression</strong> is the classical baseline: it counts how distinctive each word
            is and learns a weight per word. It is fast and surprisingly strong, which makes it a fair yardstick.{' '}
            <Link to="/performance" className="font-medium text-stone-900 underline underline-offset-2">See the results →</Link>
          </p>
        </Card>
        <Card title="Limitations">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>The newest training news is from 2022, so events and names since then may be misread.</li>
            <li>Each article gets exactly one label, even when it covers two topics, such as a footballer’s tax case.</li>
            <li>Only five categories exist: a science or health story will be forced into the closest one.</li>
            <li>DistilBERT reads only the first 512 tokens (about 380 words) of very long articles.</li>
          </ul>
        </Card>
        <Card title="Built with">
          <dl className="grid grid-cols-[7rem_1fr] gap-y-2">
            <dt className="text-stone-500">Neural model</dt><dd>PyTorch, Hugging Face Transformers</dd>
            <dt className="text-stone-500">Baseline</dt><dd>scikit-learn</dd>
            <dt className="text-stone-500">Backend</dt><dd>Python, FastAPI</dd>
            <dt className="text-stone-500">Frontend</dt><dd>React, Vite, Tailwind CSS, Recharts</dd>
          </dl>
        </Card>
      </section>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm leading-relaxed text-stone-700 shadow-sm">
      <h3 className="mb-3 font-serif text-lg font-semibold text-stone-900">{title}</h3>
      {children}
    </div>
  )
}

function Pipeline() {
  const nodes = ['News article', 'Tokenizer', 'DistilBERT', 'Softmax', 'Category']
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-dashed border-stone-300 p-4">
      <ol className="flex min-w-max items-center gap-2 text-sm" aria-label="Pipeline">
        {nodes.map((node, i) => (
          <li key={node} className="flex items-center gap-2">
            <span className={`rounded-lg px-3 py-2 font-medium ${i === 2 ? 'bg-stone-900 text-white' : 'bg-white ring-1 ring-stone-200'}`}>{node}</span>
            {i < nodes.length - 1 && <span className="text-stone-400" aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>
    </div>
  )
}
