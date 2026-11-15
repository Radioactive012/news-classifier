# Automatic News Article Classification with DistilBERT

## 1. Problem statement

Automatically classify news articles into categories such as sports, politics, business and technology.

News organisations, aggregators and search engines handle thousands of articles a day, and each one needs a section. Doing this by hand is slow and inconsistent. The goal of this project is a working web application that takes the text of any news article and returns its category with a confidence score, using a neural network.

## 2. Datasets

Two public datasets with the same five categories: business, entertainment, politics, sport and tech.

| Dataset | Years | What each item is | Articles used |
|---|---|---|---|
| **BBC News** (Greene & Cunningham, ICML 2006) | 2004–05 | Full article, median about 380 words | 2,104 (after removing duplicates) |
| **HuffPost News Category** (Misra, 2022, CC BY 4.0) | 2012–22 | Headline plus one-sentence summary, median about 28 words | 10,000 (2,000 per category) |

The BBC data came from its publisher (mlg.ucd.ie), because that copy keeps capital letters and punctuation. HuffPost has 42 categories; six were mapped to ours:

| HuffPost category | Our category |
|---|---|
| BUSINESS, MONEY | business |
| ENTERTAINMENT | entertainment |
| POLITICS | politics |
| SPORTS | sport |
| TECH | tech |

The same number of HuffPost items was sampled from each category so that no category dominates.

**Why two datasets?** The first version of this project was trained on BBC articles only. It scored 98.6% on the BBC test set, but only **68.1% on modern HuffPost news** (and the TF-IDF baseline only 48.7%). Twenty-year-old training data was the model's main weakness, so modern news was added.

Each dataset is split on its own, 80/10/10 and stratified, so both appear in every split in the same proportions:

| Split | BBC | HuffPost | Total |
|---|---|---|---|
| Train | 1,683 | 8,000 | 9,683 |
| Validation | 210 | 1,000 | 1,210 |
| Test | 211 | 1,000 | 1,211 |

The BBC split is identical to the first version's, so BBC results can be compared directly.

## 3. Preprocessing

1. **Normalise text.** Collapse repeated whitespace. HuffPost items become "headline. summary".
2. **Remove duplicates.**
   - BBC: 121 articles whose first 200 letters matched another article were removed. The BBC republished some stories with small edits, and copies in both the training and test sets would inflate the accuracy (data leakage).
   - HuffPost: repeated headlines were removed.
3. **Stratified split** with a fixed random seed (42), so every category has the same share in each split and results are reproducible.

The **validation** split is used only to choose the best training epoch, and the **test** split only for the final numbers. Neither is used for training.

## 4. Models

### 4.1 Baseline: TF-IDF + Logistic Regression

TF-IDF turns each article into a vector with one score per word and word pair (bigram). A word scores high when it is frequent in this article but rare across all articles. English stop words are removed, word pairs seen in only one article are dropped, and sublinear term frequency is used. Logistic Regression (C = 10) then learns one weight per feature per category.

### 4.2 Main model: fine-tuned DistilBERT

DistilBERT (`distilbert-base-uncased`) is a 6-layer Transformer neural network with 66 million parameters. Hugging Face pre-trained it on English Wikipedia and books by compressing the larger BERT model. A new classification layer with 5 outputs is placed on top, and the whole network is fine-tuned on the training articles (transfer learning).

- **Tokenisation:** WordPiece, with a 30,522-token vocabulary.
  - BBC articles are cut to their first 512 tokens (about 380 words).
  - HuffPost items to 128 tokens, which is more than enough for a headline and summary.
  - Each batch holds items from one dataset only, so short items are not padded to 512 tokens. This makes training more than twice as fast.
- **Training:**
  - AdamW optimiser, learning rate 3e-5 with 10% linear warm-up then linear decay, weight decay 0.01.
  - Batch size 16, 3 epochs, gradient clipping at 1.0, cross-entropy loss.
  - Batches from the two datasets are shuffled together.
- **Model selection:** the epoch with the highest validation accuracy is saved.
- **Hardware:** Apple M4 GPU (PyTorch MPS), about 8 minutes per epoch.

| Epoch | Training loss | Validation accuracy | BBC | HuffPost |
|---|---|---|---|---|
| 1 | 0.634 | 88.8% | 96.7% | 87.2% |
| 2 | 0.265 | 89.1% | 97.1% | 87.4% |
| 3 | 0.151 | **89.8%** (kept) | 97.1% | 88.3% |

### 4.3 Combined model (used by the app)

A fine-tuned network trained on single-label data learns to be very confident. Take an Indian government renewable-energy investment story: version 1 of DistilBERT said **business 99.5%, politics 0.1%**, even though the story has a clear political side.

The app therefore **averages the probabilities of DistilBERT and TF-IDF**. TF-IDF spreads its probabilities more evenly, which softens DistilBERT's overconfidence without lowering accuracy. Any other category scoring 8% or more is shown as **"Also related"**.

With the final models, the same energy story gives:

| Model | Result |
|---|---|
| Combined | **business 66.7%, politics 30.8%** (politics shown as related) |
| DistilBERT alone | business 90.1%, politics 9.1% |

## 5. Results

On the 1,211 test articles:

| Model | Overall accuracy | Macro F1 | BBC 2004–05 (211) | HuffPost 2012–22 (1,000) |
|---|---|---|---|---|
| **Combined** (used by the app) | **89.8%** | **89.8%** | **99.1%** | **87.9%** |
| DistilBERT (fine-tuned) | 89.6% | 89.6% | 98.6% | 87.7% |
| TF-IDF + Logistic Regression | 84.6% | 84.6% | 98.1% | 81.7% |
| *Version 1 DistilBERT (BBC only)* | — | — | *98.6%* | *68.1%* |
| *Version 1 TF-IDF (BBC only)* | — | — | *99.1%* | *48.7%* |

F1 score per category:

| Category | Combined | DistilBERT | TF-IDF |
|---|---|---|---|
| Business | 86.5% | 86.4% | 80.1% |
| Entertainment | 90.1% | 89.2% | 83.5% |
| Politics | 89.9% | 89.3% | 84.3% |
| Sport | 92.9% | 93.2% | 89.5% |
| Tech | 89.7% | 89.7% | 85.5% |

Confusion matrices for all three models are in `reports/confusion_*.png` and on the app's Model performance page. The most common confusion is **business ↔ tech**: 19 business items predicted as tech and 12 the other way, for example stories about tech companies' finances. Next is **politics ↔ business/entertainment**.

**Live test.** On 20 articles from BBC News published on 15 November 2026 (`reports/manual_test.md`):

| Model | Correct |
|---|---|
| Combined | 17 / 20 |
| DistilBERT | 17 / 20 |
| TF-IDF | 15 / 20 |

Version 1 got 15 / 20. The remaining misses are borderline:

- The BBC filed a Microsoft outage under Business, while the models say Tech.
- The BBC filed one Nvidia story under both Business and Tech, so any single answer counts as wrong once.

## 6. Discussion

**Modern data mattered more than model choice.** On the old BBC test set every model scores about 98–99%: the data is easy, and the models cannot be told apart. The modern HuffPost test separates them:

- Training on modern news raised DistilBERT from 68.1% to 87.7% on HuffPost.
- BBC accuracy stayed the same.

**The neural network generalises better.** Trained only on 2004–05 BBC news, DistilBERT still reached 68.1% on 2012–22 news, against 48.7% for TF-IDF. Pre-training on Wikipedia and books gave it general language knowledge that word counting cannot provide. With modern training data, DistilBERT still beats TF-IDF by 6 points on HuffPost.

**HuffPost is harder.** Each item is only a headline and one sentence (about 28 words), and categories overlap: a tech company's earnings could be business or tech. 88% on such short texts is a strong result.

**The combined model is the best of both.** It has the highest accuracy and gives more honest confidence on mixed-topic articles. The cost is speed and size: DistilBERT is 256 MB and takes about 35 ms per article on a CPU, against 4 MB and about 8 ms for TF-IDF.

## 7. Limitations

- **Data up to 2022:** events, people and products since then may be misread.
- **Different styles:** BBC data is British full articles and HuffPost is American headlines. Other countries' news or other writing styles may do slightly worse.
- **One label per article:** the "also related" display softens this, but the models were trained to give one answer.
- **Fixed categories:** there are only five. Science, health or world news is forced into the closest one.
- **Article length:** DistilBERT reads at most 512 tokens of each article.

## 8. Future work

- Add more modern full-length articles from several countries.
- Train for multiple labels per article, using a sigmoid output instead of softmax.
- Read long articles in several 512-token chunks and average the predictions.
- Try a larger model (RoBERTa or DeBERTa) now that the harder HuffPost test can show differences.
- Show which words DistilBERT itself relied on, with attention maps or integrated gradients.

## 9. System overview

- **Training:** Python, pandas, scikit-learn, PyTorch, Hugging Face Transformers.
- **Backend:** FastAPI. All models load once at startup and the server exposes three endpoints:
  - `POST /predict` for a prediction,
  - `GET /metrics` for the test results,
  - `GET /health` for server status.
- **Frontend:** React, Vite, Tailwind CSS and Recharts, with three pages:
  - **Classify:** text input, sample articles, model switch, confidence bars, "also related" topics, key words and history.
  - **Model performance:** accuracy cards with per-dataset scores, per-category table, confusion matrices and training curve.
  - **About.**
- **Tests:** 15 automated API tests (pytest) and a live-news check script.
