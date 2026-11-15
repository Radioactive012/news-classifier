# News Article Classifier

This project classifies BBC news articles into five categories.

## Phase 1 — Prepare the data

From the project root, use Python 3.10 or newer:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python training/prepare_data.py
```

The script downloads the original BBC News dataset (2,225 articles) from its publisher, [mlg.ucd.ie](http://mlg.ucd.ie/datasets/bbc.html), and caches the zip in `data/`. This copy keeps capitals and punctuation, so the training text looks like real articles.

After removing empty, duplicate and near-duplicate articles (2,104 remain), it writes stratified 80/10/10 splits to `data/train.csv`, `data/val.csv`, and `data/test.csv`. Each CSV has `text` and `label` columns. `data/labels.json` holds the shared label order. The script prints the row and class counts for each split.

## Phase 2 — Train the baseline

With the virtual environment active and the data prepared, run:

```sh
python -m pip install -r requirements.txt
python training/train_baseline.py
```

The script trains a TF-IDF and Logistic Regression pipeline on the training split and evaluates it on the test split. It saves the model to `models/baseline.joblib`, the results under `baseline` in `reports/metrics.json`, and the confusion matrix to `reports/confusion_baseline.png`. The metrics file records the label order used by the confusion matrix.
