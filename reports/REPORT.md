# Automatic News Article Classification with DistilBERT

## 1. Problem statement

Automatically classify news articles into categories such as sports, politics, business and technology.

News organisations, aggregators and search engines handle thousands of articles a day, and each one needs a section. Doing this by hand is slow and inconsistent. The goal of this project is a working web application that takes the text of any news article and returns its category with a confidence score, using a neural network.

## 2. Dataset

**BBC News** (D. Greene and P. Cunningham, ICML 2006): 2,225 full-text articles from the BBC News website, 2004–2005, each labelled with one of five categories: business, entertainment, politics, sport and tech. The original release from the publisher (mlg.ucd.ie) was used because it keeps capital letters and punctuation, so the training text looks like the articles a user will paste in.

| Split | Articles | Business | Entertainment | Politics | Sport | Tech |
|---|---|---|---|---|---|---|
| Train (80%) | 1,683 | 401 | 292 | 320 | 401 | 269 |
| Validation (10%) | 210 | 50 | 36 | 40 | 50 | 34 |
| Test (10%) | 211 | 50 | 37 | 40 | 51 | 33 |
| **Total** | **2,104** | 501 | 365 | 400 | 502 | 336 |

## 3. Preprocessing

1. Read every article file and collapse repeated whitespace.
2. **Remove duplicates and near-duplicates.** The BBC republished some stories with small edits. 121 articles whose first 200 letters matched another article were removed. Without this step, copies of the same story could appear in both the training and test sets and inflate the accuracy.
3. **Stratified split** 80/10/10 with a fixed random seed (42), so every category has the same share in each split and the split is reproducible.

The **validation** split is used only to choose the best training epoch, and the **test** split only for the final numbers below. Neither is used for training.

## 4. Models

### 4.1 Baseline: TF-IDF + Logistic Regression

TF-IDF turns each article into a vector with one score per word and word pair (bigram). A word scores high when it is frequent in this article but rare across all articles. English stop words are removed, word pairs seen in only one article are dropped, and sublinear term frequency is used. Logistic Regression (C = 10) then learns one weight per feature per category.

### 4.2 Main model: fine-tuned DistilBERT

DistilBERT (`distilbert-base-uncased`) is a 6-layer Transformer neural network with 66 million parameters. Hugging Face pre-trained it on English Wikipedia and books by compressing the larger BERT model. A new classification layer with 5 outputs is placed on top, and the whole network is fine-tuned on the training articles.

- **Tokenisation:** WordPiece, with a 30,522-token vocabulary. Each article is cut to its first 512 tokens (about 380 words).
- **Training:** AdamW optimiser, learning rate 3e-5 with 10% linear warm-up then linear decay, weight decay 0.01, batch size 16, 4 epochs, gradient clipping at 1.0, cross-entropy loss.
- **Model selection:** the epoch with the highest validation accuracy is saved.
- **Hardware:** Apple M4 GPU (PyTorch MPS), about 3.5 minutes per epoch.

| Epoch | Training loss | Validation accuracy |
|---|---|---|
| 1 | 0.711 | 96.7% |
| 2 | 0.058 | 97.1% |
| 3 | 0.041 | **97.6%** (kept) |
| 4 | 0.013 | 97.1% |

A first configuration (256 tokens, 3 epochs, learning rate 2e-5) reached 96.2% validation accuracy. Letting the network read up to 512 tokens raised it to 97.6%, so that version was kept. The choice was made on validation accuracy alone, before the test set was used.

## 5. Results

On the 211 test articles:

| Model | Accuracy | Macro F1 | Correct |
|---|---|---|---|
| DistilBERT (fine-tuned) | 98.6% | 98.7% | 208 / 211 |
| TF-IDF + Logistic Regression | 99.1% | 99.0% | 209 / 211 |

F1 score per category:

| Category | DistilBERT | Baseline |
|---|---|---|
| Business | 96.9% | 99.0% |
| Entertainment | 100.0% | 100.0% |
| Politics | 96.4% | 97.6% |
| Sport | 100.0% | 100.0% |
| Tech | 100.0% | 98.5% |

Confusion matrices: `reports/confusion_distilbert.png` and `reports/confusion_baseline.png`. They are also shown on the app's Model performance page.

**Errors.** Every DistilBERT mistake was a business article predicted as politics:

- a speech by the US Federal Reserve chairman,
- the Chancellor's economic "golden rule",
- job cuts at a newspaper.

The first two are about economic policy made by government figures, so they genuinely sit between the two categories. The baseline missed the "golden rule" article too, plus a tech article about video-game age ratings, which it labelled politics.

**Live test.** The models were also run on 20 articles published on BBC News on 15 November 2026 (`reports/manual_test.md`), 21 years after the training data:

| Model | Correct |
|---|---|
| DistilBERT | 15 / 20 |
| Baseline | 14 / 20 |

Several of the misses are not real errors. The BBC published the same Microsoft outage and Nvidia stories in both its business and technology sections, so either answer is reasonable. Other misses show real limits of the model: an advent-calendar consumer story was read as tech, and an entertainment story about a proposed change to the law was read as politics.

## 6. Discussion

Both models are near-perfect on BBC 2004–05 news, and the gap between them (one test article) is too small to call either one better. This dataset is known to be easy for word-based methods, because each section uses very distinctive words ("match", "goal" vs "MPs", "election").

DistilBERT's advantages show up elsewhere:

- **Confidence:** it is more confident on the clear sample articles in the app (about 99% against the baseline's 95–99%).
- **New text:** it did slightly better on today's news.
- **Context:** it understands word order, so it does not depend only on keywords.

The cost is size and speed. The DistilBERT model is 256 MB and takes about 35 ms per article on a CPU, against 3 MB and about 8 ms for the baseline.

## 7. Limitations

- **Old training data:** the articles are British news from 2004–05, so new topics, people and products (AI chatbots, current politicians) are under-represented.
- **One label per article:** a story about a footballer's tax case or a tech company's profits can belong to two categories.
- **Fixed categories:** there are only five. Science, health or world news is forced into the closest one.
- **Article length:** DistilBERT reads at most 512 tokens of each article.
- **Small test set:** with 211 test articles, one mistake changes accuracy by about 0.5 percentage points.

## 8. Future work

- Train on a larger, modern dataset with more categories, such as AG News or recent articles from several outlets.
- Allow more than one label per article, using a sigmoid output instead of softmax.
- Read long articles in several 512-token chunks and average the predictions.
- Show which words DistilBERT itself relied on, with attention maps or integrated gradients.
- Deploy the backend so the app can be used online.

## 9. System overview

- **Training:** Python, pandas, scikit-learn, PyTorch, Hugging Face Transformers.
- **Backend:** FastAPI. Both models load once at startup and the server exposes three endpoints:
  - `POST /predict` for a prediction,
  - `GET /metrics` for the test results,
  - `GET /health` for server status.
- **Frontend:** React, Vite, Tailwind CSS and Recharts, with three pages:
  - **Classify:** text input, sample articles, model switch, confidence bars, key words and history.
  - **Model performance:** accuracy cards, per-category table, confusion matrices and training curve.
  - **About.**
- **Tests:** 12 automated API tests (pytest) and a live-news check script.
