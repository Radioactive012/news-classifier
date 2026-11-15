# Codex handoff: deploy the News Classifier online

Open this repository in Codex and paste the prompt below. You will need to log in to Cloudflare and Hugging Face yourself when Codex asks; never paste passwords or tokens into the chat.

## Why two services

Cloudflare Pages hosts static websites for free, which suits the React frontend. It cannot run the Python backend, because PyTorch and the 256 MB DistilBERT model do not fit in Cloudflare Workers. (Cloudflare Containers could run it, but it needs the paid Workers plan.) So the plan is:

- **Frontend:** Cloudflare Pages (free), e.g. `https://news-classifier.pages.dev`
- **Backend + models:** a Hugging Face Space using Docker (free CPU, 16 GB RAM), e.g. `https://<username>-news-classifier.hf.space`
- **Model weights:** a Hugging Face model repository, downloaded by the Space when it starts, so the 256 MB weights never go into GitHub

## Prompt to paste into Codex

```
Read AGENTS.md, README.md and this file (DEPLOY_CODEX_PROMPT.md) first. The project is complete and working locally; your job is only to deploy it. Do not change the models, the training code or how the app looks.

Target:
- Backend (FastAPI + both models) on a Hugging Face Space using the Docker SDK, free CPU hardware.
- Frontend (frontend/, Vite + React) on Cloudflare Pages.
- Trained model files are in models/ (baseline.joblib, distilbert/), which is git-ignored. Upload them to a private or public Hugging Face model repo named news-classifier-models under my account, and have the Space download them at startup with huggingface_hub (snapshot_download into models/). If the repo is private, the Space reads it with an HF_TOKEN Space secret that I will add myself.

Steps, stopping after each to show me what you did and how you checked it:

1. Backend container
   - Add backend/Dockerfile (python:3.11-slim). Install CPU-only PyTorch from https://download.pytorch.org/whl/cpu to keep the image small, then the rest of requirements.txt minus pytest/httpx/matplotlib if unused at runtime, plus huggingface_hub.
   - Copy backend/ and reports/ (metrics.json and the PNGs are needed by /metrics), not data/ or frontend/.
   - Entry point: download the models if models/ is empty, then run uvicorn backend.main:app --host 0.0.0.0 --port 7860 (the port Hugging Face Spaces expects).
   - Build and run it locally with Docker, then check /health shows both models loaded and POST /predict works for a sample article. Do not continue until this works.

2. Hugging Face
   - Install the hf CLI. Ask me to run `hf auth login` myself; do not ask for my token.
   - Upload models/ to the model repo. Create the Space (Docker SDK) and push only the files the container needs, with the README front matter Spaces requires (sdk: docker, app_port: 7860).
   - Set the Space variable ALLOWED_ORIGINS to the Cloudflare Pages URL once it exists (backend/main.py already reads this, comma-separated).
   - Wait for the Space to build; check https://<space-url>/health and /docs.

3. Cloudflare Pages
   - Use wrangler via npx. Ask me to run `npx wrangler login` myself.
   - Build the frontend with VITE_API_URL set to the Space URL, then deploy frontend/dist with `npx wrangler pages deploy frontend/dist --project-name news-classifier`.
   - Add frontend/public/_redirects containing `/* /index.html 200` so /performance and /about work on refresh.
   - Open the Pages URL and check: the status dot says "Models ready", every sample classifies correctly, the Model performance page shows numbers, and refreshing /about works.

4. Docs
   - Add a "Live demo" section to README.md with both URLs and a "Deploying" section with the exact commands you used.
   - Note in README that the free Space sleeps after inactivity, so the first request can take about a minute; the frontend already shows "Connecting…" while it waits.
   - Commit with a message starting "Deploy:" and push to origin main.

Rules: never print or commit tokens; keep models/ and data/ out of git; if a step fails, show me the error and your fix rather than skipping it.
```

## Before the demo

The free Hugging Face Space sleeps after about 48 hours without visits. Open the site 2–3 minutes before presenting so the backend is awake, or run the app locally with `./start.sh` as a backup.
