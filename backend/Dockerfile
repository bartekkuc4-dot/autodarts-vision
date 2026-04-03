# ── AutoDarts Vision — Backend Docker Image ────────────────────────────────────
# CPU-only build. Ultralytics auto-detects CUDA at runtime if nvidia runtime
# is attached; without it, silently falls back to CPU.
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

WORKDIR /app

# System libraries required by Pillow / OpenCV (used internally by ultralytics)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgomp1 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgl1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY main.py .

# best.pt is mounted as a read-only volume at runtime (not baked into image)
# so weights can be updated without rebuilding.
# feedback/ is a named volume for persistent retraining data.

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
