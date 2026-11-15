"""Evaluate the fine-tuned DistilBERT model on the held-out test split.

The test split was never used for training or for choosing the best epoch,
so this is a fair estimate of accuracy on unseen articles.
"""

import json

import pandas as pd
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from common import DATA_DIR, MODEL_DIR, load_labels, save_results
from train_bert import BATCH_SIZE, MAX_LENGTH, OUTPUT_DIR, pick_device


@torch.no_grad()
def predict(texts: list[str], tokenizer, model, device) -> list[str]:
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
        ids = model(**batch).logits.argmax(dim=-1).tolist()
        predictions.extend(model.config.id2label[i] for i in ids)
    return predictions


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
    predictions = predict(test["text"].tolist(), tokenizer, model, device)
    print(f"Test articles: {len(test)}")

    training = json.loads((OUTPUT_DIR / "training_history.json").read_text(encoding="utf-8"))
    save_results("distilbert", "DistilBERT (fine-tuned)", test["label"], predictions, labels, {"training": training})


if __name__ == "__main__":
    main()
