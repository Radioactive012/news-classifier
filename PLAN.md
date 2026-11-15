# PLAN.md: News Article Classifier

## Problem statement

Automatically classify news articles into categories such as sports, politics, business and technology.

## What we are building

A web app where the user pastes a news article and gets back the predicted category plus a confidence score for every category. The main model is a fine-tuned DistilBERT neural network. A classical baseline (TF-IDF + Logistic Regression) is trained too, so the two can be compared in the app and in the college report.

## Decisions

| Area | Choice | Why |
|---|---|---|
| Dataset | BBC News, 2,225 articles in 5 classes: sport, politics, business, tech, entertainment | Matches the required categories and is small enough to train on a laptop |
| Baseline model | TF-IDF + Logistic Regression (scikit-learn) | Trains in seconds and gives a comparison point |
| Main model | Fine-tuned `distilbert-base-uncased` (Hugging Face Transformers, PyTorch) | A real neural network that trains in roughly 10–20 minutes |
| Backend | FastAPI | Simple, loads the model once at startup |
| Frontend | React + Vite + Tailwind CSS | Polished look with little effort |

Entertainment is a fifth category that comes with the dataset. Keep it.

## Phase 1: Data

- Download the BBC News dataset from its original publisher: `http://mlg.ucd.ie/files/datasets/bbc-fulltext.zip`. Use this copy, not the Hugging Face or Kaggle ones, because it keeps capitals and punctuation like real articles.
- Clean the text: strip extra whitespace, drop empty rows, drop duplicates and near-duplicates (same opening 200 letters).
- Stratified 80/10/10 train/validation/test split with seed 42.
- Save `data/train.csv`, `data/val.csv`, `data/test.csv` with columns `text` and `label`.
- Save the label list in one shared file (for example `data/labels.json`).

**Done when:** the three CSVs exist and `prepare_data.py` prints row counts and class counts per split.

## Phase 2: Baseline model

- `train_baseline.py`: TF-IDF (unigrams + bigrams, English stop words removed) + Logistic Regression.
- Save the pipeline to `models/baseline.joblib`.
- Evaluate on the test split: accuracy, per-class precision/recall/F1, confusion matrix.
- Write results under a `baseline` key in `reports/metrics.json` and save `reports/confusion_baseline.png`.

**Done when:** test accuracy is about 95% or higher and the metrics and image are saved.

## Phase 3: Neural model (DistilBERT)

- `train_bert.py`: fine-tune `distilbert-base-uncased` for 5-class classification.
- Settings: max length 512, batch size 16, 4 epochs, learning rate 3e-5 with 10% warm-up then linear decay, seed 42.
- (A first run with max length 256, 3 epochs and learning rate 2e-5 reached 96.2% validation accuracy; reading whole articles was tried next and the better run by validation accuracy was kept. The test split was not used to choose.)
- Device: CUDA, then Apple MPS, then CPU.
- Evaluate on validation after each epoch and keep the best checkpoint.
- Save model and tokenizer to `models/distilbert/`.
- `evaluate.py`: evaluate on the test split, write results under a `distilbert` key in `reports/metrics.json`, save `reports/confusion_distilbert.png`.

**Done when:** the model is saved, test accuracy is about 96% or higher, and `metrics.json` holds both models' results.

## Phase 4: Backend API

- `POST /predict` with body `{ "text": "...", "model": "distilbert" | "baseline" }`. Returns `{ "category", "confidence", "probabilities": { label: score }, "model" }`. `model` defaults to `distilbert`.
- `GET /metrics` returns the contents of `reports/metrics.json`.
- `GET /health` returns status and which models are loaded.
- Validation: reject empty text and text under 20 words with a 422 and a clear message.
- Long text is truncated to the model's max length, not rejected.
- CORS enabled for the frontend dev origin.
- Serve the confusion matrix images as static files.
- pytest tests: valid prediction returns a known label and probabilities sum to about 1; empty and too-short input are rejected; `/health` and `/metrics` respond.

**Done when:** all endpoints work from the FastAPI `/docs` page and the tests pass.

## Phase 5: Frontend

Three pages with a top navigation bar.

**Classify (home)**
- Large text box with a word counter and a "Classify" button.
- Result card: coloured category badge, top confidence as a percentage, and a horizontal confidence bar for every category.
- "Try a sample" buttons, one realistic article per category.
- Toggle between DistilBERT and the baseline model.
- History of recent predictions (kept in the browser's local storage), with a clear button.

**Model performance**
- Accuracy of both models side by side.
- Per-class precision/recall/F1 table for each model.
- Confusion matrix for each model.

**About**
- The problem statement, the dataset, and how the system works in three steps (text → tokenizer → DistilBERT → category).

All pages: loading, error and empty states; works on mobile; clear message when the backend is unreachable.

**Done when:** the full paste → classify → result flow works in the browser against the running backend, and the performance page shows real numbers from `/metrics`.

## Phase 6: Testing and polish

- Run all backend tests and fix failures.
- Manually classify at least 10 current articles from real news sites; record the article headline, true category, predicted category and confidence in `reports/manual_test.md`.
- Complete `README.md`: what the project is, setup, how to train, how to run backend and frontend, screenshots.
- Add a single command or short script that starts backend and frontend together.

**Done when:** a fresh clone can be set up and run by following the README alone.

## Phase 7: College deliverables

- `reports/REPORT.md` with sections: problem statement, dataset, preprocessing, the two models, results comparison (real numbers from `metrics.json`), limitations, future work.
- Limitations to state: the dataset is 2004–05 UK news, so very modern topics may be misclassified; articles spanning two topics get only one label.
- `reports/DEMO.md`: a 3-minute demo script (one sample per category, switch models, show the performance page).

**Done when:** both documents exist and every number in them matches `metrics.json`.

## Progress

- [x] Phase 1: Data
- [x] Phase 2: Baseline model
- [ ] Phase 3: Neural model
- [ ] Phase 4: Backend API
- [ ] Phase 5: Frontend
- [ ] Phase 6: Testing and polish
- [ ] Phase 7: College deliverables
