"""Loads the trained models once and turns article text into predictions."""

import json
import re
import time
from pathlib import Path

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
BASELINE_PATH = MODEL_DIR / "baseline.joblib"
DISTILBERT_DIR = MODEL_DIR / "distilbert"

MODEL_NAMES = {
    "distilbert": "DistilBERT (fine-tuned)",
    "baseline": "TF-IDF + Logistic Regression",
}


class ModelNotAvailable(Exception):
    pass


class Classifier:
    def __init__(self) -> None:
        self.baseline = None
        self.tokenizer = None
        self.bert = None
        self.max_length = 256
        self.labels: list[str] = []
        self.load()

    def load(self) -> None:
        if BASELINE_PATH.exists():
            self.baseline = joblib.load(BASELINE_PATH)
            self.labels = list(self.baseline.classes_)

        if (DISTILBERT_DIR / "config.json").exists():
            # Imported here so the API can still start (baseline only) if
            # PyTorch is not installed.
            import torch
            from transformers import AutoModelForSequenceClassification, AutoTokenizer

            torch.set_grad_enabled(False)
            self.tokenizer = AutoTokenizer.from_pretrained(DISTILBERT_DIR)
            # CPU is fast enough for one article at a time and works on every machine.
            self.bert = AutoModelForSequenceClassification.from_pretrained(DISTILBERT_DIR).eval()
            self.labels = [self.bert.config.id2label[i] for i in range(self.bert.config.num_labels)]
            history = DISTILBERT_DIR / "training_history.json"
            if history.exists():
                self.max_length = json.loads(history.read_text(encoding="utf-8"))["max_length"]

    @property
    def available(self) -> dict[str, bool]:
        return {"distilbert": self.bert is not None, "baseline": self.baseline is not None}

    def predict(self, text: str, model: str) -> dict:
        started = time.perf_counter()
        if model == "distilbert":
            if self.bert is None:
                raise ModelNotAvailable("The DistilBERT model is not trained yet. Run training/train_bert.py.")
            probabilities, truncated = self._predict_bert(text)
        else:
            if self.baseline is None:
                raise ModelNotAvailable("The baseline model is not trained yet. Run training/train_baseline.py.")
            probabilities, truncated = self._predict_baseline(text), False

        category = max(probabilities, key=probabilities.get)
        return {
            "category": category,
            "confidence": probabilities[category],
            "probabilities": probabilities,
            "model": model,
            "model_name": MODEL_NAMES[model],
            "key_terms": self.key_terms(text, category),
            "word_count": len(text.split()),
            "truncated": truncated,
            "max_tokens": self.max_length,
            "elapsed_ms": round((time.perf_counter() - started) * 1000, 1),
        }

    def _predict_bert(self, text: str) -> tuple[dict[str, float], bool]:
        import torch

        # The network reads at most max_length tokens (the headline and opening
        # paragraphs); anything after that is cut off.
        full_length = len(self.tokenizer(text, verbose=False)["input_ids"])
        tokens = self.tokenizer(text, truncation=True, max_length=self.max_length, return_tensors="pt")
        logits = self.bert(**tokens).logits[0]
        # Softmax turns the network's raw scores into probabilities that add up to 1.
        scores = torch.softmax(logits, dim=-1).tolist()
        return {label: float(s) for label, s in zip(self.labels, scores)}, full_length > self.max_length

    def _predict_baseline(self, text: str) -> dict[str, float]:
        scores = self.baseline.predict_proba([text])[0]
        return {label: float(s) for label, s in zip(self.baseline.classes_, scores)}

    def key_terms(self, text: str, category: str, limit: int = 6) -> list[str]:
        """Words in the text that push the baseline model most strongly towards
        `category`: the TF-IDF score of each word times its learned weight."""
        if self.baseline is None:
            return []
        vectorizer, logreg = self.baseline.steps[0][1], self.baseline.steps[-1][1]
        row = vectorizer.transform([text])
        weights = logreg.coef_[list(logreg.classes_).index(category)]
        contribution = row.multiply(weights).tocsr()
        order = np.argsort(contribution.data)[::-1]
        vocabulary = vectorizer.get_feature_names_out()
        terms: list[str] = []
        for i in order:
            if contribution.data[i] <= 0 or len(terms) == limit:
                break
            term = vocabulary[contribution.indices[i]]
            # Skip a phrase if one of its words is already listed, to avoid "bank" + "central bank".
            if not any(re.search(rf"\b{re.escape(w)}\b", term) or re.search(rf"\b{re.escape(term)}\b", w) for w in terms):
                terms.append(term)
        return terms
