"""Train the baseline: TF-IDF word features + Logistic Regression.

TF-IDF turns each article into a long vector of word and word-pair scores
(common in this article, rare across all articles = high score). Logistic
Regression then learns one weight per feature per category.
"""

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

from common import DATA_DIR, MODEL_DIR, SEED, load_labels, save_results


def main() -> None:
    labels = load_labels()
    train = pd.read_csv(DATA_DIR / "train.csv")
    test = pd.read_csv(DATA_DIR / "test.csv")

    model = make_pipeline(
        # min_df=2 drops word pairs seen in only one article, which keeps the
        # saved model small without hurting accuracy.
        TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True, min_df=2),
        LogisticRegression(random_state=SEED, max_iter=1000, C=10),
    )
    model.fit(train["text"], train["label"])
    if list(model.classes_) != labels:
        raise ValueError("Training labels do not match data/labels.json")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_DIR / "baseline.joblib")
    print(f"Training articles: {len(train)}")
    print(f"Test articles: {len(test)}")
    print("Saved model: models/baseline.joblib")

    save_results("baseline", "TF-IDF + Logistic Regression", test["label"], model.predict(test["text"]), labels)


if __name__ == "__main__":
    main()
