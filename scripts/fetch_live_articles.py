"""Manual check on today's news: fetch recent BBC articles from each section's
RSS feed, classify them with both models, and write reports/manual_test.md.

The BBC section an article was published in is used as its true category.
Run from the project root:  python scripts/fetch_live_articles.py
"""

import re
import sys
import xml.etree.ElementTree as ET
from datetime import date
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from backend.classifier import Classifier  # noqa: E402

FEEDS = {
    "business": "https://feeds.bbci.co.uk/news/business/rss.xml",
    "entertainment": "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    "politics": "https://feeds.bbci.co.uk/news/politics/rss.xml",
    "sport": "https://feeds.bbci.co.uk/sport/rss.xml",
    "tech": "https://feeds.bbci.co.uk/news/technology/rss.xml",
}
PER_CATEGORY = 4
HEADERS = {"User-Agent": "Mozilla/5.0 (news-classifier college project)"}


def get(url: str) -> str:
    with urlopen(Request(url, headers=HEADERS), timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def article_text(url: str) -> str:
    """Join the body paragraphs of a BBC article page."""
    html = get(url)
    match = re.search(r"<article.*?</article>", html, flags=re.S)
    paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", match.group(0) if match else "", flags=re.S)
    kept = []
    for paragraph in paragraphs:
        text = unescape(re.sub(r"<[^>]+>", "", paragraph)).strip()
        # Skip image captions and short "related story" links.
        if text.startswith("Image source") or len(text.split()) < 8:
            continue
        kept.append(text)
    return re.sub(r"\s+", " ", " ".join(kept)).strip()


def main() -> None:
    classifier = Classifier()
    rows = []
    for label, feed in FEEDS.items():
        items = ET.fromstring(get(feed)).iter("item")
        found = 0
        for item in items:
            link = item.findtext("link", "")
            # Skip videos, live pages and other non-article formats.
            if found == PER_CATEGORY or "/live/" in link or "/videos/" in link or "/av/" in link:
                if found == PER_CATEGORY:
                    break
                continue
            title = item.findtext("title", "").strip()
            try:
                body = article_text(link)
            except Exception as error:  # a page that fails to load is just skipped
                print(f"skip {link}: {error}")
                continue
            if len(body.split()) < 80:
                continue
            text = f"{title}. {body}"
            result = {m: classifier.predict(text, m) for m in ("combined", "distilbert", "baseline") if classifier.available[m]}
            rows.append((label, title, link, result))
            found += 1
            print(f"{label:13} {title[:60]:60} -> " + ", ".join(f"{m}: {r['category']}" for m, r in result.items()))

    models = [m for m in ("combined", "distilbert", "baseline") if classifier.available[m]]
    names = {"combined": "Combined", "distilbert": "DistilBERT", "baseline": "TF-IDF"}
    lines = [
        "# Manual test on current news",
        "",
        f"Run on {date.today():%d %B %Y}. {len(rows)} recent articles from BBC News RSS feeds, "
        "classified with both models. The BBC section an article was published in is taken as its true category.",
        "",
        "| Section | Headline | " + " | ".join(names[m] for m in models) + " |",
        "|---|---|" + "---|" * len(models),
    ]
    correct = dict.fromkeys(models, 0)
    for label, title, link, result in rows:
        cells = []
        for m in models:
            r = result[m]
            ok = r["category"] == label
            correct[m] += ok
            cells.append(f"{'✅' if ok else '❌'} {r['category']} ({r['confidence']:.0%})")
        lines.append(f"| {label} | [{title.replace('|', '-')}]({link}) | " + " | ".join(cells) + " |")
    lines += ["", "## Score", ""]
    for m in models:
        lines.append(f"- **{names[m]}:** {correct[m]} / {len(rows)} correct ({correct[m] / max(len(rows), 1):.0%})")
    lines += [
        "",
        "Notes: this is a small, informal check. Some BBC stories sit between sections "
        "(for example a business story about a tech company), so a \"wrong\" answer can still be reasonable.",
        "",
    ]
    (ROOT / "reports" / "manual_test.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines[-6:]))
    print("Saved reports/manual_test.md")


if __name__ == "__main__":
    main()
