#!/usr/bin/env bash
# Build the frontend and start the whole app at http://localhost:8000
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -x .venv/bin/uvicorn ]; then
  echo "Python environment missing. Run: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  exit 1
fi
if [ ! -f models/baseline.joblib ]; then
  echo "No trained models. Run the training steps in README.md first."
  exit 1
fi
[ -d frontend/node_modules ] || npm --prefix frontend install
npm --prefix frontend run build
echo
echo "Open http://localhost:8000"
exec .venv/bin/uvicorn backend.main:app --port 8000
