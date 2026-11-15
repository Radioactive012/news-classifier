"""Download the compressed models for the online server (used by Render's build).

The trained models are not stored in Git (too big), so they live in a public
Hugging Face model repository. This fetches only what the ONNX server needs.

Security: the files come from one fixed version (commit) of that repository,
and each file's SHA-256 fingerprint is checked before it is saved. If anyone
changed the files on Hugging Face, the build stops instead of loading them
(baseline.joblib is a Python pickle, which can run code when loaded).

Run from the project root:  python scripts/download_models.py
After uploading new models, update REVISION and the hashes below.
"""

import hashlib
from pathlib import Path
from urllib.request import urlopen

REPO = "Radioactive012/news-classifier-models"
REVISION = "820f91ca71e616772b1a9e480d01541f2e5de920"
FILES = {
    "baseline.joblib": "0d13977f54fd1b18ec8f5bd6e386c2ca0b9feafb2317073512eb3b7046e0f73d",
    "distilbert_onnx/model.onnx": "2d8e4d10923e16385254a7a5f6469a285fae83d9143eb3ea616eb926100198b5",
    "distilbert_onnx/tokenizer.json": "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0",
    "distilbert_onnx/labels.json": "dd2998e63ac36beb2c01c2fe3dbac0ca890742bf9c3fb58f21f9410866058113",
}
MODEL_DIR = Path(__file__).resolve().parents[1] / "models"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


for name, expected in FILES.items():
    target = MODEL_DIR / name
    if target.exists() and sha256(target.read_bytes()) == expected:
        print(f"already have {name}")
        continue
    url = f"https://huggingface.co/{REPO}/resolve/{REVISION}/{name}"
    with urlopen(url, timeout=300) as response:
        data = response.read()
    if sha256(data) != expected:
        raise SystemExit(f"{name} does not match its expected SHA-256. Refusing to use it.")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    print(f"downloaded and verified {name} ({len(data) / 1e6:.1f} MB)")
