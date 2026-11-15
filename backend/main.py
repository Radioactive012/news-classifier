"""FastAPI server for the news classifier.

Run from the project root:  uvicorn backend.main:app --reload --port 8000
Interactive API docs:       http://localhost:8000/docs
"""

import json
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .classifier import ROOT, Classifier, ModelNotAvailable

REPORT_DIR = ROOT / "reports"
FRONTEND_DIST = ROOT / "frontend" / "dist"
MIN_WORDS = 20
MAX_CHARS = 50_000

classifier: Classifier | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the models once when the server starts, not on every request.
    global classifier
    classifier = Classifier()
    yield


app = FastAPI(title="News Article Classifier", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    text: str = Field(..., max_length=MAX_CHARS, description="The full news article")
    model: Literal["distilbert", "baseline"] = "distilbert"


class PredictResponse(BaseModel):
    category: str
    confidence: float
    probabilities: dict[str, float]
    model: str
    model_name: str
    key_terms: list[str]
    word_count: int
    truncated: bool
    max_tokens: int
    elapsed_ms: float


@app.get("/health")
def health():
    return {"status": "ok", "models": classifier.available, "labels": classifier.labels}


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(422, "Please paste a news article first.")
    words = len(text.split())
    if words < MIN_WORDS:
        raise HTTPException(422, f"The text is too short ({words} words). Paste at least {MIN_WORDS} words of an article.")
    try:
        return classifier.predict(text, request.model)
    except ModelNotAvailable as error:
        raise HTTPException(503, str(error))


@app.get("/metrics")
def metrics():
    path = REPORT_DIR / "metrics.json"
    if not path.exists():
        raise HTTPException(404, "No metrics yet. Train and evaluate the models first.")
    return json.loads(path.read_text(encoding="utf-8"))


app.mount("/reports", StaticFiles(directory=REPORT_DIR, check_dir=False), name="reports")


# When the frontend has been built (npm run build), serve it from this server
# too, so the whole app runs at http://localhost:8000 with one command.
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        file = (FRONTEND_DIST / path).resolve()
        if path and file.is_file() and FRONTEND_DIST.resolve() in file.parents:
            return FileResponse(file)
        return FileResponse(FRONTEND_DIST / "index.html")
