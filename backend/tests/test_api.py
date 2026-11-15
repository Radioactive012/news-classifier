"""API tests. Run from the project root:  pytest backend/tests"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app

SPORT_ARTICLE = (
    "Arsenal came from behind to beat Chelsea 2-1 in a thrilling Premier League match at the "
    "Emirates Stadium on Saturday. The striker scored twice in the second half after the visitors "
    "had taken an early lead through a header from a corner. The manager praised his players for "
    "their fighting spirit and said the win keeps the club in the title race with ten games left."
)
BUSINESS_ARTICLE = (
    "Shares in the bank fell sharply on Tuesday after it reported a drop in annual profits and warned "
    "that rising interest rates would hit lending. The firm said pre-tax profit fell 12% to 3.1 billion "
    "pounds, below analysts' forecasts. Investors were also worried by a slowdown in mortgage demand "
    "and the chief executive said the company would cut costs to protect its dividend."
)

# Business news with a strong government angle.
MIXED_ARTICLE = (
    "NEW DELHI, November 15, 2026 — The Indian government has announced a major investment "
    "initiative aimed at expanding the country's renewable energy capacity, with a particular focus "
    "on solar and wind power. The initiative is expected to attract billions of dollars in private "
    "investment over the next five years. Officials say the programme will support the development "
    "of large-scale solar parks, offshore wind farms, and improved energy storage infrastructure. "
    "The government believes the investment will help reduce India's dependence on imported fossil "
    "fuels while creating thousands of jobs in engineering, manufacturing, and infrastructure "
    "development. However, some industry experts have raised concerns about the challenges of "
    "implementing the programme. These include land acquisition, inconsistent power distribution "
    "infrastructure, and the high initial costs associated with renewable energy projects. "
    "Environmental organizations have welcomed the announcement, arguing that accelerating the "
    "transition to clean energy is essential for reducing carbon emissions and addressing climate "
    "change. The government is expected to release further details about funding allocations and "
    "implementation timelines in the coming months."
)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as client:  # "with" runs startup, which loads the models
        yield client


@pytest.fixture(scope="module")
def models(client):
    return [name for name, ready in client.get("/health").json()["models"].items() if ready]


def test_health(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert set(body["labels"]) == {"business", "entertainment", "politics", "sport", "tech"}


@pytest.mark.parametrize("model", ["combined", "distilbert", "baseline"])
@pytest.mark.parametrize("text,expected", [(SPORT_ARTICLE, "sport"), (BUSINESS_ARTICLE, "business")])
def test_predict(client, models, model, text, expected):
    if model not in models:
        pytest.skip(f"{model} is not trained")
    response = client.post("/predict", json={"text": text, "model": model})
    assert response.status_code == 200
    body = response.json()
    assert body["category"] == expected
    assert body["model"] == model
    assert sum(body["probabilities"].values()) == pytest.approx(1.0, abs=1e-4)
    assert body["confidence"] == max(body["probabilities"].values())
    assert body["word_count"] == len(text.split())


def test_default_model_is_combined(client, models):
    if "combined" not in models:
        pytest.skip("models are not trained")
    assert client.post("/predict", json={"text": SPORT_ARTICLE}).json()["model"] == "combined"


def test_mixed_article_shows_related_topic(client, models):
    if "combined" not in models:
        pytest.skip("models are not trained")
    body = client.post("/predict", json={"text": MIXED_ARTICLE}).json()
    assert body["category"] == "business"
    assert "politics" in body["related"]
    assert client.post("/predict", json={"text": SPORT_ARTICLE}).json()["related"] == []


def test_long_article_is_truncated_not_rejected(client, models):
    if "distilbert" not in models:
        pytest.skip("distilbert is not trained")
    body = client.post("/predict", json={"text": SPORT_ARTICLE * 10}).json()
    assert body["category"] == "sport"
    assert body["truncated"] is True


@pytest.mark.parametrize("text", ["", "   ", "Only a few words here."])
def test_rejects_empty_or_short_text(client, text):
    response = client.post("/predict", json={"text": text})
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)


def test_rejects_unknown_model(client):
    assert client.post("/predict", json={"text": SPORT_ARTICLE, "model": "gpt"}).status_code == 422


def test_metrics(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "baseline" in response.json()
