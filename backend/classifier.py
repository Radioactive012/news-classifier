"""Loads the trained models once and turns article text into predictions."""

import importlib.util
import json
import os
import re
import time
from pathlib import Path

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
BASELINE_PATH = MODEL_DIR / "baseline.joblib"
DISTILBERT_DIR = MODEL_DIR / "distilbert"
# Compressed copy for the online server (see training/export_onnx.py).
ONNX_DIR = MODEL_DIR / "distilbert_onnx"

MODEL_NAMES = {
    "combined": "DistilBERT + TF-IDF (combined)",
    "distilbert": "DistilBERT (fine-tuned)",
    "baseline": "TF-IDF + Logistic Regression",
}


# A second category is shown as "also related" when it gets at least this share.
RELATED_THRESHOLD = 0.08


class ModelNotAvailable(Exception):
    pass


class Classifier:
    def __init__(self) -> None:
        self.baseline = None
        self.tokenizer = None
        self.bert = None
        self.engine = None  # "pytorch" or "onnx"
        self.max_length = 256
        self.labels: list[str] = []
        self.load()

    def load(self) -> None:
        if BASELINE_PATH.exists():
            self.baseline = joblib.load(BASELINE_PATH)
            self.labels = list(self.baseline.classes_)

        # Use PyTorch when it is installed (local development), otherwise the
        # lighter ONNX Runtime (the online server). NEWS_ENGINE=onnx forces ONNX.
        want_onnx = os.environ.get("NEWS_ENGINE") == "onnx" or importlib.util.find_spec("torch") is None
        if not want_onnx and (DISTILBERT_DIR / "config.json").exists():
            self._load_pytorch()
        elif (ONNX_DIR / "model.onnx").exists():
            self._load_onnx()

    def _load_pytorch(self) -> None:
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
        self.engine = "pytorch"

    def _load_onnx(self) -> None:
        import onnxruntime
        from tokenizers import Tokenizer

        info = json.loads((ONNX_DIR / "labels.json").read_text(encoding="utf-8"))
        self.labels, self.max_length = info["labels"], info["max_length"]
        self.tokenizer = Tokenizer.from_file(str(ONNX_DIR / "tokenizer.json"))
        self.tokenizer.no_padding()
        self.tokenizer.enable_truncation(self.max_length)
        options = onnxruntime.SessionOptions()
        options.intra_op_num_threads = 1  # small servers have a fraction of one CPU
        options.enable_cpu_mem_arena = False  # keeps memory low on the 512 MB free plan
        options.enable_mem_pattern = False  # do not keep pre-planned buffers around
        self.bert = onnxruntime.InferenceSession(str(ONNX_DIR / "model.onnx"), options, providers=["CPUExecutionProvider"])
        self.engine = "onnx"

    @property
    def available(self) -> dict[str, bool]:
        both = self.bert is not None and self.baseline is not None
        return {"combined": both, "distilbert": self.bert is not None, "baseline": self.baseline is not None}

    def predict(self, text: str, model: str) -> dict:
        started = time.perf_counter()
        if not self.available[model]:
            raise ModelNotAvailable(f"The {MODEL_NAMES[model]} model is not trained yet. See README.md.")
        truncated = False
        if model == "distilbert":
            probabilities, truncated = self._predict_bert(text)
        elif model == "baseline":
            probabilities = self._predict_baseline(text)
        else:
            # Combined: average the two models' probabilities. DistilBERT is
            # very confident (it was trained on single-topic articles), while
            # TF-IDF spreads its scores more, so the average gives a fairer
            # picture for articles that touch on two topics.
            bert, truncated = self._predict_bert(text)
            tfidf = self._predict_baseline(text)
            probabilities = {label: (bert[label] + tfidf[label]) / 2 for label in self.labels}

        category = max(probabilities, key=probabilities.get)
        related = [label for label, p in sorted(probabilities.items(), key=lambda kv: -kv[1])
                   if label != category and p >= RELATED_THRESHOLD]
        return {
            "category": category,
            "confidence": probabilities[category],
            "probabilities": probabilities,
            "related": related,
            "model": model,
            "model_name": MODEL_NAMES[model],
            "key_terms": self.key_terms(text, category),
            "word_count": len(text.split()),
            "truncated": truncated,
            "max_tokens": self.max_length,
            "elapsed_ms": round((time.perf_counter() - started) * 1000, 1),
        }

    def _predict_bert(self, text: str) -> tuple[dict[str, float], bool]:
        if self.engine == "onnx":
            encoding = self.tokenizer.encode(text)
            feed = {
                "input_ids": np.array([encoding.ids], dtype=np.int64),
                "attention_mask": np.array([encoding.attention_mask], dtype=np.int64),
            }
            logits = self.bert.run(["logits"], feed)[0][0]
            scores = np.exp(logits - logits.max())
            scores /= scores.sum()
            return {label: float(s) for label, s in zip(self.labels, scores)}, bool(encoding.overflowing)

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
