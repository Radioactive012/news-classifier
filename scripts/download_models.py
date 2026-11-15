"""Download the compressed models for the online server (used by Render's build).

The trained models are not stored in Git (too big), so they live in a public
Hugging Face model repository. This fetches only what the ONNX server needs.
Run from the project root:  python scripts/download_models.py
"""

from pathlib import Path
from urllib.request import urlopen

REPO = "Radioactive012/news-classifier-models"
FILES = [
    "baseline.joblib",
    "distilbert_onnx/model.onnx",
    "distilbert_onnx/tokenizer.json",
    "distilbert_onnx/labels.json",
]
MODEL_DIR = Path(__file__).resolve().parents[1] / "models"

for name in FILES:
    target = MODEL_DIR / name
    if target.exists():
        print(f"already have {name}")
        continue
    target.parent.mkdir(parents=True, exist_ok=True)
    url = f"https://huggingface.co/{REPO}/resolve/main/{name}"
    with urlopen(url, timeout=300) as response:
        target.write_bytes(response.read())
    print(f"downloaded {name} ({target.stat().st_size / 1e6:.1f} MB)")
