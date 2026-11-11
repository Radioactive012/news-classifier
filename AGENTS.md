# AGENTS.md

Instructions for any AI coding agent working in this repository. Read this file and `PLAN.md` fully before writing code.

## What this project is

A college AI project: a web app that automatically classifies news articles into categories (sport, politics, business, tech, entertainment). The user pastes an article, and a fine-tuned DistilBERT neural network returns the predicted category with confidence scores for every class. A TF-IDF + Logistic Regression baseline exists for comparison.

The owner is a student who must demo this and explain it in a viva. Working, simple, readable code matters more than cleverness.

## Source of truth

`PLAN.md` defines the phases, the deliverables and the "done when" check for each phase. Follow it. If something in the plan turns out to be wrong or impossible, say so and propose the smallest change instead of silently deviating.

## How to work

- Build one phase at a time, in order. Do not start the next phase until the current one meets its "done when" check.
- At the end of each phase, stop and report: what was built, the exact commands to run it, and the result you saw when you ran it.
- Actually run what you build (scripts, tests, the server). Never report something as working unless you ran it. If you could not run it, say so.
- Update the "Progress" checklist at the bottom of `PLAN.md` when a phase is finished.
- Keep `README.md` current with setup and run commands as they come into existence.
- When a phase passes its "done when" check, commit it with a message starting `Phase N:` and push to `origin main` (private GitHub repo). Never commit `data/`, `models/` or `.venv/`.

## Tech stack (do not swap without asking)

- Python 3.10+ with a virtual environment in `.venv/`
- Data and baseline: pandas, scikit-learn, joblib
- Neural model: PyTorch + Hugging Face `transformers` and `datasets`, model `distilbert-base-uncased`
- Backend: FastAPI + uvicorn, tests with pytest
- Frontend: React + Vite + Tailwind CSS (plain JavaScript, no TypeScript)
- Charts: Recharts

## Folder structure

```
news-classifier/
  AGENTS.md
  PLAN.md
  README.md
  requirements.txt
  data/        raw data and train/val/test CSVs
  training/    prepare_data.py, train_baseline.py, train_bert.py, evaluate.py
  models/      baseline.joblib and distilbert/
  reports/     metrics.json and confusion matrix images
  backend/     FastAPI app (main.py, classifier.py, tests/)
  frontend/    React app
```

## Rules

- Fixed random seed (42) everywhere: data split, baseline, DistilBERT training.
- The test split is used only for final evaluation, never for training or tuning.
- Both models are evaluated on the same test split and write to the same `reports/metrics.json`.
- Pick the training device automatically: CUDA, then Apple MPS, then CPU.
- The backend loads models once at startup, not per request.
- Label names and their order live in one shared place and are read from there by training, backend and frontend.
- Do not commit large files: add `data/`, `models/`, `.venv/`, `node_modules/` to `.gitignore`.
- No paid APIs, no API keys, no cloud services. Everything runs locally.
- No hardcoded absolute paths. Resolve paths relative to the project root.
- Keep dependencies minimal and pin them in `requirements.txt` and `package.json`.
- Write short comments only where the reason for the code is not obvious. The owner has to explain this code.

## Commands (create these and keep them working)

```
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python training/prepare_data.py
python training/train_baseline.py
python training/train_bert.py
python training/evaluate.py

uvicorn backend.main:app --reload --port 8000
pytest backend/tests

cd frontend && npm install && npm run dev
```

## Frontend quality bar

- Clean, modern look with consistent spacing and one accent colour; each category has its own badge colour.
- Works on mobile widths.
- Every action has loading, error and empty states. If the backend is down, show a clear message instead of a blank page.
- Backend URL comes from one config value (`VITE_API_URL`, default `http://localhost:8000`).
