"""Shared paths and helpers for the training and evaluation scripts."""

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # draw images without opening a window
import matplotlib.pyplot as plt
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"
METRICS_PATH = REPORT_DIR / "metrics.json"
SEED = 42


def load_labels() -> list[str]:
    return json.loads((DATA_DIR / "labels.json").read_text(encoding="utf-8"))


def save_results(name: str, title: str, y_true, y_pred, labels: list[str], extra: dict | None = None) -> float:
    """Compute test metrics for one model, merge them into reports/metrics.json
    under `name`, and save reports/confusion_<name>.png. Returns accuracy."""
    accuracy = accuracy_score(y_true, y_pred)
    report = classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y_true, y_pred, labels=labels)

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8")) if METRICS_PATH.exists() else {}
    metrics[name] = {
        "title": title,
        "accuracy": accuracy,
        "macro_f1": report["macro avg"]["f1-score"],
        "test_size": len(y_true),
        "labels": labels,
        "per_class": {
            label: {
                "precision": report[label]["precision"],
                "recall": report[label]["recall"],
                "f1": report[label]["f1-score"],
                "support": int(report[label]["support"]),
            }
            for label in labels
        },
        # Rows are the true label, columns the predicted label, both in `labels` order.
        "confusion_matrix": matrix.tolist(),
        **(extra or {}),
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")

    display = ConfusionMatrixDisplay(confusion_matrix=matrix, display_labels=labels)
    display.plot(cmap="Blues", values_format="d", xticks_rotation=45, colorbar=False)
    display.ax_.set_title(f"{title} confusion matrix")
    display.figure_.tight_layout()
    display.figure_.savefig(REPORT_DIR / f"confusion_{name}.png", dpi=150)
    plt.close(display.figure_)

    print(f"Test accuracy: {accuracy:.4f} ({accuracy:.2%})")
    print(classification_report(y_true, y_pred, labels=labels, digits=4, zero_division=0))
    print(f"Saved metrics under '{name}' in reports/metrics.json")
    print(f"Saved confusion matrix: reports/confusion_{name}.png")
    return accuracy
