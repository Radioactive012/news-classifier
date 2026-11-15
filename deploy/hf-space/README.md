---
title: News Classifier API
emoji: 📰
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Classifies news articles with fine-tuned DistilBERT
---

# News Classifier API

FastAPI backend for the News Classifier college project. It classifies a news article into business, entertainment, politics, sport or tech using a fine-tuned DistilBERT model, a TF-IDF + Logistic Regression baseline, and the two combined.

- `POST /predict` with `{"text": "...", "model": "combined" | "distilbert" | "baseline"}`
- `GET /metrics` test-set results
- `GET /health` status
- Interactive docs: `/docs`
