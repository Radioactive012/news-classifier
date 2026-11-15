#!/usr/bin/env bash
# Assemble the Hugging Face Space folder in deploy/hf-space/build/ from the
# project's backend, trained models and reports. Upload it with:
#   .venv/bin/hf upload <user>/news-classifier-api deploy/hf-space/build . --repo-type space
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=deploy/hf-space/build
rm -rf "$OUT" && mkdir -p "$OUT/backend" "$OUT/models" "$OUT/reports"
cp deploy/hf-space/Dockerfile deploy/hf-space/requirements.txt deploy/hf-space/README.md "$OUT/"
cp backend/__init__.py backend/main.py backend/classifier.py "$OUT/backend/"
cp -R models/baseline.joblib models/distilbert "$OUT/models/"
cp reports/metrics.json reports/*.png "$OUT/reports/"
du -sh "$OUT"
