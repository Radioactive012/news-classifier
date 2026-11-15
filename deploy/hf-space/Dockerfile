# Hugging Face Space (Docker SDK) that runs the FastAPI backend with both models.
FROM python:3.11-slim

WORKDIR /app
# CPU-only PyTorch keeps the image much smaller than the default CUDA build.
RUN pip install --no-cache-dir torch==2.15.0 --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend backend
COPY models models
COPY reports reports

# Hugging Face Spaces send traffic to port 7860.
EXPOSE 7860
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
