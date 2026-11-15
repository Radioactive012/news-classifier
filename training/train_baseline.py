import json
from pathlib import Path

import joblib
import matplotlib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.pipeline import make_pipeline

matplotlib.use("Agg")
import matplotlib.pyplot as plt


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"


def main() -> None:
    labels = json.loads((DATA_DIR / "labels.json").read_text(encoding="utf-8"))
    train = pd.read_csv(DATA_DIR / "train.csv")
    test = pd.read_csv(DATA_DIR / "test.csv")

    model = make_pipeline(
        TfidfVectorizer(ngram_range=(1, 2), stop_words="english"),
        LogisticRegression(random_state=42, max_iter=1000),
    )
    model.fit(train["text"], train["label"])
    if set(model.classes_) != set(labels):
        raise ValueError("Training labels do not match data/labels.json")
    if not set(test["label"]).issubset(labels):
        raise ValueError("Test labels do not match data/labels.json")

    predictions = model.predict(test["text"])
    accuracy = accuracy_score(test["label"], predictions)
    class_report = classification_report(
        test["label"], predictions, labels=labels, output_dict=True, zero_division=0
    )
    matrix = confusion_matrix(test["label"], predictions, labels=labels)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_DIR / "baseline.joblib")

    metrics_path = REPORT_DIR / "metrics.json"
    if metrics_path.exists():
        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    else:
        metrics = {}
    metrics["baseline"] = {
        "accuracy": accuracy,
        "labels": labels,
        "per_class": {
            label: {
                "precision": class_report[label]["precision"],
                "recall": class_report[label]["recall"],
                "f1": class_report[label]["f1-score"],
                "support": int(class_report[label]["support"]),
            }
            for label in labels
        },
        "confusion_matrix": matrix.tolist(),
    }
    metrics_path.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")

    display = ConfusionMatrixDisplay(confusion_matrix=matrix, display_labels=labels)
    display.plot(cmap="Blues", values_format="d", xticks_rotation=45)
    display.ax_.set_title("Baseline confusion matrix")
    display.figure_.tight_layout()
    display.figure_.savefig(REPORT_DIR / "confusion_baseline.png", dpi=150)
    plt.close(display.figure_)

    print(f"Training articles: {len(train)}")
    print(f"Test articles: {len(test)}")
    print(f"Test accuracy: {accuracy:.4f} ({accuracy:.2%})")
    print(classification_report(test["label"], predictions, labels=labels, digits=4, zero_division=0))
    print("Saved model: models/baseline.joblib")
    print("Saved metrics: reports/metrics.json")
    print("Saved confusion matrix: reports/confusion_baseline.png")


if __name__ == "__main__":
    main()
