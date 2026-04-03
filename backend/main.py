"""
AutoDarts Vision – FastAPI Backend
===================================
Endpoint POST /predict accepts a Base64-encoded dart-board image and returns
detected dart segments with scores.

If best.pt is not present (e.g. still training), the server starts in MOCK
mode and returns a hardcoded response so the frontend can still be developed.
"""

from __future__ import annotations

import base64
import io
import json
import logging
import warnings
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("autodarts")

# ---------------------------------------------------------------------------
# FastAPI app + CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AutoDarts Vision API",
    description="YOLOv8-powered dart scoring backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # frontend runs on a different local port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Model initialisation (with graceful fallback)
# ---------------------------------------------------------------------------
model = None

try:
    from ultralytics import YOLO  # type: ignore

    model = YOLO("best.pt")
    log.info("✅  YOLOv8 model loaded from best.pt")
except FileNotFoundError:
    warnings.warn(
        "⚠️  best.pt not found – running in MOCK mode. "
        "Place the trained weights at best.pt to enable real inference.",
        UserWarning,
        stacklevel=1,
    )
    log.warning("Model not found – MOCK mode active")
except Exception as exc:          # noqa: BLE001
    warnings.warn(
        f"⚠️  Could not load model ({exc}) – running in MOCK mode.",
        UserWarning,
        stacklevel=1,
    )
    log.warning("Model load error (%s) – MOCK mode active", exc)

# ---------------------------------------------------------------------------
# Score map  (82 classes)
# ---------------------------------------------------------------------------
# Class naming convention used by the training dataset:
#   b        → bullseye       = 50 pts
#   sb       → single bull    = 25 pts
#   For numbers 1-20:
#     i<n>   → inner single   = n pts
#     o<n>   → outer single   = n pts
#     d<n>   → double         = n * 2 pts
#     t<n>   → triple         = n * 3 pts

SCORE_MAP: dict[str, int] = {"b": 50, "sb": 25}

for _n in range(1, 21):
    SCORE_MAP[f"i{_n}"] = _n          # inner single
    SCORE_MAP[f"o{_n}"] = _n          # outer single
    SCORE_MAP[f"d{_n}"] = _n * 2      # double
    SCORE_MAP[f"t{_n}"] = _n * 3      # triple

log.info("Score map initialised with %d classes", len(SCORE_MAP))

# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    """Body expected by POST /predict."""

    image: str  # Base64 string, optionally prefixed with data:image/...;base64,


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _decode_image(b64_string: str) -> Image.Image:
    """Strip the optional Data-URL prefix and decode to a PIL Image."""
    if "," in b64_string:
        # e.g. "data:image/jpeg;base64,/9j/4AAQ..."
        b64_string = b64_string.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(b64_string)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return image
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not decode image: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.post("/predict")
async def predict(body: PredictRequest) -> dict[str, Any]:
    """
    Receive a Base64-encoded frame and return detected dart segments.

    Returns
    -------
    JSON::

        {
          "status": "success",
          "data": {
            "predictions": [
              {"class": "T20", "score": 60, "confidence": 0.923},
              ...
            ],
            "total_score": int
          }
        }
    """
    image = _decode_image(body.image)

    # ------------------------------------------------------------------
    # MOCK mode – model not available
    # ------------------------------------------------------------------
    if model is None:
        log.info("MOCK response returned (model not loaded)")
        return {
            "status": "success",
            "data": {
                "predictions": [
                    {
                        "class": "T20",
                        "score": 60,
                        "confidence": 0.950,
                        "bbox": {"x1": 0.42, "y1": 0.08, "x2": 0.58, "y2": 0.28},
                    },
                    {
                        "class": "S20",
                        "score": 20,
                        "confidence": 0.880,
                        "bbox": {"x1": 0.45, "y1": 0.30, "x2": 0.55, "y2": 0.45},
                    },
                ],
            },
        }

    # ------------------------------------------------------------------
    # Real inference
    # ------------------------------------------------------------------
    try:
        results = model.predict(image, conf=0.65, verbose=False)
    except Exception as exc:
        log.error("Inference error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

    predictions: list[dict[str, Any]] = []

    # ultralytics returns a list of Results objects (one per image)
    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            # class index → name
            cls_idx = int(box.cls[0].item())
            cls_name: str = result.names[cls_idx]          # e.g. "t20", "b", "d5"
            confidence: float = float(box.conf[0].item())

            # Normalised bounding box (0–1), no manual division needed
            norm = box.xyxyn[0]

            score = SCORE_MAP.get(cls_name.lower(), 0)

            predictions.append(
                {
                    "class": cls_name.upper(),              # "T20", "B", "D5" …
                    "score": score,
                    "confidence": round(confidence, 3),
                    "bbox": {
                        "x1": round(float(norm[0]), 4),
                        "y1": round(float(norm[1]), 4),
                        "x2": round(float(norm[2]), 4),
                        "y2": round(float(norm[3]), 4),
                    },
                }
            )

    log.info(
        "Detected %d dart(s) on board | confidences: %s",
        len(predictions),
        [p["confidence"] for p in predictions],
    )

    return {
        "status": "success",
        "data": {
            "predictions": predictions,
            # NOTE: total_score intentionally removed.
            # Per-throw score is determined by the frontend spatial tracker
            # (IoU-based) which isolates the single NEW dart from all visible.
        },
    }


# ---------------------------------------------------------------------------
# Feedback request schema
# ---------------------------------------------------------------------------

class FeedbackRequest(BaseModel):
    """Body for POST /feedback — saves a correction for future retraining."""

    image:          str    # Base64 JPEG frame
    predicted_class: str   # What the model predicted (wrong)
    correct_class:  str    # What the user confirmed is correct
    confidence:     float  # Model confidence for the wrong prediction
    bbox:           dict[str, float]  # bbox of the wrong detection


# Folder where feedback is stored (relative to backend/)
FEEDBACK_DIR   = Path("feedback")
FEEDBACK_IMAGES = FEEDBACK_DIR / "images"
FEEDBACK_LOG   = FEEDBACK_DIR / "feedback.jsonl"


@app.post("/feedback")
async def feedback(body: FeedbackRequest) -> dict[str, str]:
    """
    Save a user-corrected detection for later retraining.

    Creates:
      feedback/images/<timestamp>_pred-<wrong>_correct-<right>.jpg
      feedback/feedback.jsonl  (one JSON object per line)
    """
    FEEDBACK_IMAGES.mkdir(parents=True, exist_ok=True)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    img_name = f"{ts}_pred-{body.predicted_class}_correct-{body.correct_class}.jpg"

    # Save image
    image = _decode_image(body.image)
    image.save(FEEDBACK_IMAGES / img_name, "JPEG", quality=95)

    # Append structured log entry
    entry = {
        "timestamp":       ts,
        "image_file":      img_name,
        "predicted_class": body.predicted_class,
        "correct_class":   body.correct_class,
        "confidence":      body.confidence,
        "bbox":            body.bbox,
    }
    with FEEDBACK_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

    log.info(
        "Feedback saved ✔  predicted=%s  correct=%s  file=%s",
        body.predicted_class,
        body.correct_class,
        img_name,
    )
    return {"status": "ok", "saved": img_name}


# ---------------------------------------------------------------------------
# Health-check (optional, handy for frontend connectivity tests)
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict[str, str]:
    """Quick liveness probe."""
    mode = "model" if model is not None else "mock"
    return {"status": "ok", "mode": mode}


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
