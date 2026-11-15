"""Evaluate DistilBERT, and DistilBERT + TF-IDF combined, on the held-out test split.

The test split was never used for training or for choosing the best epoch,
so this is a fair estimate of accuracy on unseen articles.
"""

import json

import joblib
import numpy as np
import pandas as pd
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from common import DATA_DIR, MODEL_DIR, load_labels, save_results
from train_bert import BATCH_SIZE, MAX_LENGTH, OUTPUT_DIR, pick_device


@torch.no_grad()
def predict_proba(texts: list[str], tokenizer, model, device) -> np.ndarray:
    model.eval()
    predictions = []
    for start in range(0, len(texts), BATCH_SIZE * 2):
        batch = tokenizer(
            texts[start : start + BATCH_SIZE * 2],
            truncation=True,
            max_length=MAX_LENGTH,
            padding=True,
            return_tensors="pt",
        ).to(device)
        predictions.append(torch.softmax(model(**batch).logits, dim=-1).cpu().numpy())
    return np.concatenate(predictions)


def main() -> None:
    if not (OUTPUT_DIR / "config.json").exists():
        raise SystemExit("No trained model in models/distilbert. Run: python training/train_bert.py")

    labels = load_labels()
    device = pick_device()
    tokenizer = AutoTokenizer.from_pretrained(OUTPUT_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(OUTPUT_DIR).to(device)
    if [model.config.id2label[i] for i in range(len(labels))] != labels:
        raise ValueError("Model labels do not match data/labels.json")

    test = pd.read_csv(DATA_DIR / "test.csv")
    bert = predict_proba(test["text"].tolist(), tokenizer, model, device)
    print(f"Test articles: {len(test)}")

    training = json.loads((OUTPUT_DIR / "training_history.json").read_text(encoding="utf-8"))
    print("\n== DistilBERT ==")
    save_results("distilbert", "DistilBERT (fine-tuned)", test["label"],
                 [labels[i] for i in bert.argmax(axis=1)], labels, {"training": training})

    # Combined model: the average of DistilBERT's and the baseline's
    # probabilities. This is what the web app uses by default.
    baseline = joblib.load(MODEL_DIR / "baseline.joblib")
    combined = (bert + baseline.predict_proba(test["text"])) / 2
    print("\n== Combined (DistilBERT + TF-IDF) ==")
    save_results("combined", "DistilBERT + TF-IDF (combined)", test["label"],
                 [labels[i] for i in combined.argmax(axis=1)], labels)


if __name__ == "__main__":
    main()
