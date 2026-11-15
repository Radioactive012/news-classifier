"""Fine-tune DistilBERT to classify news articles.

DistilBERT is a 66-million-parameter Transformer neural network, pre-trained
by Hugging Face on English Wikipedia and books. We add a small classification
layer on top and train the whole network on our articles for a few epochs.

Writes models/distilbert/ (the best epoch by validation accuracy) and
models/distilbert/training_history.json. Run evaluate.py afterwards.
"""

import json
import random
import time

import numpy as np
import pandas as pd
import torch
from torch.utils.data import DataLoader, TensorDataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from common import DATA_DIR, MODEL_DIR, SEED, load_labels

BASE_MODEL = "distilbert-base-uncased"
OUTPUT_DIR = MODEL_DIR / "distilbert"
MAX_LENGTH = 512  # tokens (the most DistilBERT can read); covers most whole articles
BATCH_SIZE = 16
EPOCHS = 4
LEARNING_RATE = 3e-5
WARMUP_FRACTION = 0.1


def pick_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")  # Apple Silicon GPU
    return torch.device("cpu")


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def encode(tokenizer, frame: pd.DataFrame, label_to_id: dict[str, int]) -> TensorDataset:
    """Turn articles into token ids the network understands."""
    tokens = tokenizer(
        frame["text"].tolist(),
        truncation=True,
        max_length=MAX_LENGTH,
        padding="max_length",
        return_tensors="pt",
    )
    targets = torch.tensor([label_to_id[label] for label in frame["label"]])
    return TensorDataset(tokens["input_ids"], tokens["attention_mask"], targets)


@torch.no_grad()
def accuracy_on(model, loader: DataLoader, device: torch.device) -> float:
    model.eval()
    correct = total = 0
    for input_ids, attention_mask, targets in loader:
        logits = model(input_ids=input_ids.to(device), attention_mask=attention_mask.to(device)).logits
        correct += (logits.argmax(dim=-1).cpu() == targets).sum().item()
        total += len(targets)
    return correct / total


def main() -> None:
    set_seed(SEED)
    device = pick_device()
    labels = load_labels()
    label_to_id = {label: i for i, label in enumerate(labels)}
    print(f"Device: {device}")

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    model = AutoModelForSequenceClassification.from_pretrained(
        BASE_MODEL,
        num_labels=len(labels),
        id2label=dict(enumerate(labels)),
        label2id=label_to_id,
    ).to(device)

    train_set = encode(tokenizer, pd.read_csv(DATA_DIR / "train.csv"), label_to_id)
    val_set = encode(tokenizer, pd.read_csv(DATA_DIR / "val.csv"), label_to_id)
    generator = torch.Generator().manual_seed(SEED)
    train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True, generator=generator)
    val_loader = DataLoader(val_set, batch_size=BATCH_SIZE * 2)

    # AdamW optimiser; the learning rate warms up for the first 10% of steps
    # and then falls linearly to zero, the standard recipe for fine-tuning BERT.
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
    total_steps = EPOCHS * len(train_loader)
    warmup_steps = int(WARMUP_FRACTION * total_steps)

    def lr_factor(step: int) -> float:
        if step < warmup_steps:
            return (step + 1) / warmup_steps
        return max(0.0, (total_steps - step) / (total_steps - warmup_steps))

    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_factor)

    history = []
    best_val = -1.0
    for epoch in range(1, EPOCHS + 1):
        model.train()
        started = time.time()
        running_loss = 0.0
        for step, (input_ids, attention_mask, targets) in enumerate(train_loader, start=1):
            # Passing labels makes the model return the cross-entropy loss.
            output = model(
                input_ids=input_ids.to(device),
                attention_mask=attention_mask.to(device),
                labels=targets.to(device),
            )
            output.loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad()
            running_loss += output.loss.item()
            if step % 20 == 0 or step == len(train_loader):
                print(f"  epoch {epoch} step {step}/{len(train_loader)} loss {running_loss / step:.4f}", flush=True)

        train_loss = running_loss / len(train_loader)
        val_accuracy = accuracy_on(model, val_loader, device)
        seconds = time.time() - started
        history.append({"epoch": epoch, "train_loss": train_loss, "val_accuracy": val_accuracy, "seconds": seconds})
        print(f"Epoch {epoch}: train loss {train_loss:.4f}, validation accuracy {val_accuracy:.2%}, {seconds:.0f}s")

        if val_accuracy > best_val:
            best_val = val_accuracy
            model.save_pretrained(OUTPUT_DIR)
            tokenizer.save_pretrained(OUTPUT_DIR)
            print(f"  saved as best model so far -> {OUTPUT_DIR.relative_to(MODEL_DIR.parent)}")

    info = {
        "base_model": BASE_MODEL,
        "max_length": MAX_LENGTH,
        "batch_size": BATCH_SIZE,
        "epochs": EPOCHS,
        "learning_rate": LEARNING_RATE,
        "device": str(device),
        "best_val_accuracy": best_val,
        "history": history,
    }
    (OUTPUT_DIR / "training_history.json").write_text(json.dumps(info, indent=2) + "\n", encoding="utf-8")
    print(f"Best validation accuracy: {best_val:.2%}. Now run: python training/evaluate.py")


if __name__ == "__main__":
    main()
