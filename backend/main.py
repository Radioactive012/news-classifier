"""FastAPI server for the news classifier.

Run from the project root:  uvicorn backend.main:app --reload --port 8000
Interactive API docs:       http://localhost:8000/docs
"""

import asyncio
import json
import os
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .classifier import ROOT, Classifier, ModelNotAvailable

REPORT_DIR = ROOT / "reports"
FRONTEND_DIST = ROOT / "frontend" / "dist"
MIN_WORDS = 20
MAX_CHARS = 50_000
# Reject request bodies bigger than this before reading them, so nobody can
# fill the 512 MB server's memory with a huge upload (50,000 characters of
# text is well under 200 KB even with the JSON around it).
MAX_BODY_BYTES = 200_000
# All predictions run one at a time on ONE dedicated thread. On Linux, every
# thread gets its own memory pool, and spreading predictions over the web
# server's many threads made memory grow with each request until Render's
# 512 MB free plan killed the server. Each prediction takes under a second,
# so other requests just wait their turn.
MODEL_THREAD = ThreadPoolExecutor(max_workers=1, thread_name_prefix="model")

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
    # Extra origins (e.g. the deployed frontend's URL) come from the
    # ALLOWED_ORIGINS environment variable, comma-separated.
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]
    + [origin.strip() for origin in os.environ.get("ALLOWED_ORIGINS", "").split(",") if origin.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    if request.method == "POST":
        length = request.headers.get("content-length")
        if length is None or not length.isdigit():
            return JSONResponse({"detail": "Content-Length header required."}, status_code=411)
        if int(length) > MAX_BODY_BYTES:
            return JSONResponse({"detail": "The article is too long. Paste at most about 50,000 characters."}, status_code=413)
    return await call_next(request)


class PredictRequest(BaseModel):
    text: str = Field(..., description="The full news article")
    model: Literal["combined", "distilbert", "baseline"] = "combined"


class PredictResponse(BaseModel):
    category: str
    confidence: float
    probabilities: dict[str, float]
    related: list[str]
    model: str
    model_name: str
    key_terms: list[str]
    word_count: int
    truncated: bool
    max_tokens: int
    elapsed_ms: float


@app.get("/health")
def health():
    return {"status": "ok", "models": classifier.available, "labels": classifier.labels, "engine": classifier.engine}


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    text = request.text.strip()
    if len(text) > MAX_CHARS:
        raise HTTPException(413, f"The article is too long. Paste at most {MAX_CHARS:,} characters.")
    if not text:
        raise HTTPException(422, "Please paste a news article first.")
    words = len(text.split())
    if words < MIN_WORDS:
        raise HTTPException(422, f"The text is too short ({words} words). Paste at least {MIN_WORDS} words of an article.")
    job = asyncio.get_running_loop().run_in_executor(MODEL_THREAD, classifier.predict, text, request.model)
    try:
        return await asyncio.wait_for(job, timeout=60)
    except ModelNotAvailable as error:
        raise HTTPException(503, str(error))
    except TimeoutError:
        raise HTTPException(503, "The AI is busy. Please try again in a moment.")


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
