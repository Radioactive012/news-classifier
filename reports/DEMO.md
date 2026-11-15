# 3-minute demo script

**Before the demo:** run `./start.sh`, open http://localhost:8000, and check the top-right corner says **Models ready** (green). Clear the "Recent predictions" list.

## 1. The problem (20 s)

> "News sites publish thousands of stories a day and each needs a section. My project classifies a news article into business, entertainment, politics, sport or tech automatically, using a fine-tuned DistilBERT neural network."

## 2. Classify the samples (60 s) — *Classify page*

1. Click **Sport**. Point out the green badge, the confidence and the bars for every category.
2. Click **Politics**, then **Business**, **Tech** and **Entertainment**. Each one lands in the right category.
3. Point to **Words linked to…**: "these are the words in the article that pushed the decision."

## 3. A real article from today (40 s)

1. Open any story on bbc.co.uk/news (or another news site), copy the headline and text, paste it in, click **Classify article**.
2. Switch the model toggle between **Combined**, **DistilBERT** and **TF-IDF + LogReg**: the result re-runs instantly so the models can be compared.
3. Paste a story that mixes topics, e.g. a government investment programme. Combined shows **Business** with **Also related: Politics**. Switch to DistilBERT alone and it says business 99.5%: explain that the network is overconfident because it only ever saw single-topic articles, and combining it with TF-IDF fixes that.

## 4. How good is it? (40 s) — *Model performance page*

1. Read the three accuracy cards: all models were tested on 211 articles never seen in training.
2. Show the confusion matrix: "the diagonal is correct, anything red is a mistake."
3. Show **How DistilBERT learned**: the loss falls each epoch while validation accuracy rises.

## 5. Wrap up (20 s) — *About page*

> "The article is split into tokens, DistilBERT reads them all at once using self-attention, and a softmax layer turns its output into probabilities. The main limitation is that the training news is from 2004–05, so brand-new topics can confuse it."

## If something goes wrong

- **"Backend offline"**: the server is not running. Run `./start.sh` again.
- **"Baseline only"**: the DistilBERT model files are missing from `models/distilbert/`. Run `python training/train_bert.py` and `python training/evaluate.py`.
- **"Text is too short"**: paste at least 20 words.
