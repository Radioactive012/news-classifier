"""Export the fine-tuned DistilBERT to a small ONNX file for the online server.

The full PyTorch server needs about 800 MB of memory, more than Render's free
plan allows (512 MB). ONNX Runtime is a much lighter engine, and int8
quantisation stores each weight in 1 byte instead of 4, so the model shrinks
from about 256 MB to about 65 MB with almost no change in its answers.

Writes models/distilbert_onnx/: model.onnx, tokenizer.json, labels.json.
Run after train_bert.py:  python training/export_onnx.py
"""

import json
import shutil

import torch
from onnxruntime.quantization import QuantType, quantize_dynamic
from transformers import AutoModelForSequenceClassification

from common import MODEL_DIR
from train_bert import MAX_LENGTH, OUTPUT_DIR

ONNX_DIR = MODEL_DIR / "distilbert_onnx"


def main() -> None:
    ONNX_DIR.mkdir(parents=True, exist_ok=True)
    model = AutoModelForSequenceClassification.from_pretrained(OUTPUT_DIR).eval()

    # A dummy input only fixes the input names; batch size and length stay flexible.
    dummy = {
        "input_ids": torch.ones(1, 16, dtype=torch.long),
        "attention_mask": torch.ones(1, 16, dtype=torch.long),
    }
    full_path = ONNX_DIR / "model_fp32.onnx"
    torch.onnx.export(
        model,
        (dummy["input_ids"], dummy["attention_mask"]),
        full_path,
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "sequence"},
            "attention_mask": {0: "batch", 1: "sequence"},
            "logits": {0: "batch"},
        },
        opset_version=17,
        dynamo=False,
    )

    quantize_dynamic(full_path, ONNX_DIR / "model.onnx", weight_type=QuantType.QInt8)
    full_path.unlink()
    for leftover in ONNX_DIR.glob("*.data"):
        leftover.unlink()

    shutil.copy(OUTPUT_DIR / "tokenizer.json", ONNX_DIR / "tokenizer.json")
    labels = [model.config.id2label[i] for i in range(model.config.num_labels)]
    (ONNX_DIR / "labels.json").write_text(
        json.dumps({"labels": labels, "max_length": MAX_LENGTH}, indent=2) + "\n", encoding="utf-8"
    )
    size = (ONNX_DIR / "model.onnx").stat().st_size / 1e6
    print(f"Saved {ONNX_DIR.relative_to(MODEL_DIR.parent)}/model.onnx ({size:.0f} MB)")


if __name__ == "__main__":
    main()
