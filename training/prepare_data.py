import hashlib
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
# The publisher only offers plain HTTP, so the file is checked against its
# known SHA-256 fingerprint before use.
ZIP_SHA256 = "a351031a62325b3d7ff13146eeb035c22feca8290913b5183d1ff3be35109495"

# HuffPost News Category Dataset (Misra, 2022; CC BY 4.0): headlines and short
# descriptions from 2012-2022. Adds modern, American news to the 2004-05 BBC
# articles, so the model knows newer topics (smartphones, social media, Trump).
HUFFPOST_URL = "https://huggingface.co/datasets/heegyu/news-category-dataset/resolve/main/data.json"
HUFFPOST_PATH = DATA_DIR / "huffpost" / "data.json"
HUFFPOST_SHA256 = "2cfc51fa4a82a96ecbe251fa383737aa1dea2e0a517f61dece633fcc25a4a065"
HUFFPOST_LABELS = {
    "BUSINESS": "business",
    "MONEY": "business",
    "ENTERTAINMENT": "entertainment",
    "POLITICS": "politics",
    "SPORTS": "sport",
    "TECH": "tech",
}
HUFFPOST_PER_CATEGORY = 2000  # tech only has about 2,000, so every category gets the same


def download(url: str, path: Path, sha256: str) -> None:
    """Download once, and refuse a file whose fingerprint does not match."""
    if not path.exists():
        with urlopen(url, timeout=120) as response:
            path.write_bytes(response.read())
    if hashlib.sha256(path.read_bytes()).hexdigest() != sha256:
        path.unlink()
        raise SystemExit(f"{path.name} does not match its expected SHA-256 and was deleted. Try again.")


def load_articles() -> pd.DataFrame:
    """Read every bbc/<label>/<id>.txt file in the zip into one table."""
    download(DATASET_URL, ZIP_PATH, ZIP_SHA256)
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


def load_huffpost() -> pd.DataFrame:
    HUFFPOST_PATH.parent.mkdir(parents=True, exist_ok=True)
    download(HUFFPOST_URL, HUFFPOST_PATH, HUFFPOST_SHA256)
    rows = pd.read_json(HUFFPOST_PATH, lines=True)
    rows = rows[rows["category"].isin(HUFFPOST_LABELS)]
    rows = rows.drop_duplicates(subset="headline")
    rows["text"] = rows["headline"].str.strip() + ". " + rows["short_description"].str.strip()
    rows["label"] = rows["category"].map(HUFFPOST_LABELS)
    # The same number of articles per category, picked at random (but repeatably).
    rows = rows.groupby("label").sample(n=HUFFPOST_PER_CATEGORY, random_state=SEED)
    return rows[["text", "label"]]


def split(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Stratified 80/10/10 train/validation/test split."""
    train, holdout = train_test_split(frame, test_size=0.2, stratify=frame["label"], random_state=SEED)
    val, test = train_test_split(holdout, test_size=0.5, stratify=holdout["label"], random_state=SEED)
    return train, val, test


def dedup_key(text: str) -> str:
    """First 200 letters and digits. The BBC republished some stories with a
    few words changed or extra paragraphs added; those share the same opening,
    so this treats them as one article and they cannot leak across splits."""
    return re.sub(r"[^a-z0-9]", "", text.lower())[:200]


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    bbc = load_articles()
    raw_count = len(bbc)
    bbc["text"] = bbc["text"].str.replace(r"\s+", " ", regex=True).str.strip()
    bbc = bbc[bbc["text"] != ""]
    bbc = bbc[~bbc["text"].map(dedup_key).duplicated()]
    print(f"BBC News 2004-05: {raw_count} articles, {len(bbc)} after removing duplicates")

    huffpost = load_huffpost()
    huffpost["text"] = huffpost["text"].str.replace(r"\s+", " ", regex=True).str.strip()
    print(f"HuffPost 2012-22: {len(huffpost)} articles ({HUFFPOST_PER_CATEGORY} per category)")

    # Each source is split on its own, so both appear in train, validation and
    # test in the same proportions. The BBC split is the same as before.
    splits = {"train": [], "val": [], "test": []}
    for source, frame in (("bbc", bbc), ("huffpost", huffpost)):
        for name, part in zip(splits, split(frame)):
            splits[name].append(part.assign(source=source))

    labels = sorted(bbc["label"].unique())
    for name, parts in splits.items():
        frame = pd.concat(parts, ignore_index=True)
        frame.to_csv(DATA_DIR / f"{name}.csv", columns=["text", "label", "source"], index=False)
        print(f"\n{name}: {len(frame)} rows")
        print(pd.crosstab(frame["label"], frame["source"], margins=True, margins_name="total").to_string())

    (DATA_DIR / "labels.json").write_text(json.dumps(labels, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
