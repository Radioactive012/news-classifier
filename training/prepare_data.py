import json
import re
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile

import pandas as pd
from sklearn.model_selection import train_test_split


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SEED = 42
# Original BBC News dataset (Greene & Cunningham, 2006) from its publisher.
# We use this copy because it keeps capitals and punctuation, so training
# text looks like the articles a user will paste into the app.
DATASET_URL = "http://mlg.ucd.ie/files/datasets/bbc-fulltext.zip"
ZIP_PATH = DATA_DIR / "bbc-fulltext.zip"


def download(url: str, path: Path) -> None:
    if path.exists():
        return
    with urlopen(url, timeout=60) as response:
        contents = response.read()
    path.write_bytes(contents)


def load_articles() -> pd.DataFrame:
    """Read every bbc/<label>/<id>.txt file in the zip into one table."""
    download(DATASET_URL, ZIP_PATH)
    rows = []
    with ZipFile(ZIP_PATH) as archive:
        # Sorted so the row order (and therefore the split) is always the same.
        for name in sorted(archive.namelist()):
            parts = name.split("/")
            if len(parts) != 3 or not name.endswith(".txt"):
                continue
            # A few files contain bytes that are not valid UTF-8 (e.g. a pound sign).
            text = archive.read(name).decode("utf-8", errors="replace")
            rows.append({"text": text, "label": parts[1]})
    return pd.DataFrame(rows)


def dedup_key(text: str) -> str:
    """First 200 letters and digits. The BBC republished some stories with a
    few words changed or extra paragraphs added; those share the same opening,
    so this treats them as one article and they cannot leak across splits."""
    return re.sub(r"[^a-z0-9]", "", text.lower())[:200]


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    articles = load_articles()
    raw_count = len(articles)

    articles["text"] = articles["text"].str.replace(r"\s+", " ", regex=True).str.strip()
    articles = articles[articles["text"] != ""]
    articles = articles[~articles["text"].map(dedup_key).duplicated()]
    labels = sorted(articles["label"].unique())
    print("Source: BBC News original full text (mlg.ucd.ie)")
    print(f"Raw articles: {raw_count}")
    print(f"Clean articles: {len(articles)}")

    train, holdout = train_test_split(
        articles, test_size=0.2, stratify=articles["label"], random_state=SEED
    )
    val, test = train_test_split(
        holdout, test_size=0.5, stratify=holdout["label"], random_state=SEED
    )

    for name, split in (("train", train), ("val", val), ("test", test)):
        split.to_csv(DATA_DIR / f"{name}.csv", columns=["text", "label"], index=False)
        counts = split["label"].value_counts()
        print(f"{name}: {len(split)} rows")
        for label in labels:
            print(f"  {label}: {counts.get(label, 0)}")

    (DATA_DIR / "labels.json").write_text(json.dumps(labels, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
