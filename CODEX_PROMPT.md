# Prompts for Codex

Open the `news-classifier` folder in Codex, then paste the first prompt.

## 1. Starting prompt

```
This folder is a college AI project: a news article classifier web app.

Before writing any code, read AGENTS.md and PLAN.md completely. AGENTS.md has the rules, tech stack and folder structure. PLAN.md has the seven phases and a "done when" check for each one.

Then build Phase 1 only:
- set up the Python virtual environment and requirements.txt
- create the folder structure and .gitignore
- write and run training/prepare_data.py

Run the script yourself and confirm the "done when" check passes. Then stop and tell me:
1. what you built
2. the exact commands to run it
3. the output you saw
Tick Phase 1 in the Progress list in PLAN.md. Do not start Phase 2 until I say so.
```

## 2. Prompt for every later phase

Change the phase number each time.

```
Phase 1 looks good. Now build Phase 2 from PLAN.md, following AGENTS.md. Run it, confirm the "done when" check passes, tick it in PLAN.md, then stop and report what you built, the commands to run it, and the output you saw.
```

## 3. If something breaks

```
This is not working. Here is what I ran and the full error:

<paste command and error here>

Find the cause, fix it, run it again to confirm it works, and tell me what was wrong.
```

## 4. Before the viva

```
Explain this project to me as if I have to defend it in a viva. Cover: how the data is prepared, how TF-IDF + Logistic Regression works, how DistilBERT is fine-tuned, what the metrics mean, and how the frontend talks to the backend. Then give me 15 likely examiner questions with short answers.
```
