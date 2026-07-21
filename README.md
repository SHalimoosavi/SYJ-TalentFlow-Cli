# TalentFlow CLI

**AI-powered recruitment automation toolkit — right from your terminal.**

Resume screening, candidate ranking, interview prep, and recruiter emails, in
one lightweight, cross-platform CLI. Runs on Windows, Linux, macOS, and
Android (Termux) with zero native dependencies.

[![CI](https://github.com/SHalimoosavi/talentflow-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/SHalimoosavi/talentflow-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js >=22](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TalentFlow CLI v1.0.0
  AI Recruitment Automation Toolkit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Candidates Parsed     42
  Shortlisted            9
  Review                 12
  Rejected                21
  Average Match          81%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [AI providers](#ai-providers)
- [Output formats](#output-formats)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [FAQ](#faq)

## Overview

TalentFlow CLI is a recruiter's toolkit that lives entirely in the terminal.
Point it at a job description and a folder of resumes, and it will parse,
score, rank, and report on every candidate — then generate tailored interview
kits and recruiter emails for the ones you shortlist.

It's built to be **dependency-light by design**: no PDF megalibraries, no
native compilation, no platform-specific code. That means it runs exactly the
same way on a recruiter's Windows laptop, a hiring manager's Mac, a CI
pipeline on Linux, or a phone running Termux.

## Architecture

TalentFlow separates CLI/UX code from business logic (parsers, scoring, AI
providers, reports) so every piece is independently testable and reusable.
See [`docs/architecture.md`](docs/architecture.md) for the full breakdown and
diagram.

```
talentflow-cli/
├── bin/                  # CLI executable
├── src/
│   ├── cli/                # commander wiring, interactive mode, dashboard UI
│   ├── commands/            # one file per `talentflow <command>`
│   ├── parser/                # resume + job description parsing
│   ├── scoring/                 # keyword / weighted / semantic scoring + ranking
│   ├── ai/                        # AIProvider abstraction (Anthropic/OpenAI/OpenRouter)
│   ├── reports/                     # Markdown / JSON / CSV report generation
│   ├── templates/                     # interview + email prompt/fallback templates
│   ├── utils/                           # fs, text, and logging helpers
│   └── config/                            # .env-driven configuration loader
├── examples/, jobs/, resumes/, output/   # sample data + generated output
├── tests/                # node:test unit tests
└── docs/                 # architecture + plugin docs
```

## Features

### 🧠 Intelligent resume parser

Reads `.txt` and `.md` resumes and extracts name, email, phone, skills,
experience, education, certifications, projects, and keywords into normalized
JSON. PDF support is intentionally left to an optional plugin — see
[`docs/plugins.md`](docs/plugins.md) — to keep the core tool light.

### 🎯 AI resume matching engine

Every candidate is scored three ways:

- **Keyword matching** — raw overlap between resume and JD vocabulary
- **Weighted scoring** — configurable blend of skills match, experience
  match, and keyword overlap
- **Semantic scoring** — optional LLM-based evaluation (Anthropic / OpenAI /
  OpenRouter) that also returns strengths, weaknesses, and a recruiter
  summary

### 🏆 Candidate ranking engine

Classifies every candidate into **Shortlisted / Review / Rejected** using
configurable thresholds, and exports the ranking as CSV, JSON, and Markdown.

### 🗣️ AI interview generator

For every shortlisted candidate, generates technical, behavioural,
culture-fit, resume-specific, and follow-up interview questions, saved as
Markdown.

### ✉️ AI email generator

Drafts recruiter emails — interview invitation, rejection, request for more
information, final round invitation, offer preparation — in your choice of
formal, friendly, startup, or corporate tone.

### 📊 Beautiful terminal dashboard

ASCII banner, colored progress bars, status badges, and a ranked candidate
table, rendered with `chalk` and `cli-table3`.

### 💻 Interactive + scriptable CLI

Run `talentflow` with no arguments for a guided interactive session, or run
any command directly for scripting/CI use.

## Installation

**Requirements:** [Node.js 22+](https://nodejs.org)

### Windows (PowerShell or CMD)

```powershell
git clone https://github.com/SHalimoosavi/talentflow-cli.git
cd talentflow-cli
npm install
npm link      # optional: makes `talentflow` available globally
```

### Linux / macOS

```bash
git clone https://github.com/SHalimoosavi/talentflow-cli.git
cd talentflow-cli
npm install
npm link      # optional: makes `talentflow` available globally
```

### Android (Termux)

```bash
pkg update && pkg install nodejs-lts git -y
git clone https://github.com/SHalimoosavi/talentflow-cli.git
cd talentflow-cli
npm install
node bin/talentflow.js doctor   # sanity-check your environment
```

`npm link` may require extra permissions in Termux — running via
`node bin/talentflow.js <command>` always works.

## Usage

### Interactive mode

```bash
talentflow
```

Walks you through screening, interview generation, emails, and configuration
with simple prompts — no flags required.

### Direct commands

```bash
# Parse resumes into normalized JSON
talentflow parse --resumes resumes/

# Full screening pipeline: parse + score + rank + report
talentflow screen --jd jobs/backend.txt --resumes resumes/

# Screen without AI (keyword/weighted scoring only)
talentflow screen --jd jobs/backend.txt --resumes resumes/ --no-ai

# Generate interview kits for shortlisted candidates
talentflow interview --jd jobs/backend.txt

# Regenerate reports from an existing candidates.json
talentflow reports --jd jobs/backend.txt

# Draft interview-invitation emails for shortlisted candidates
talentflow emails --jd jobs/backend.txt --type interview-invitation \
  --tone friendly --status Shortlisted --company "Acme Inc."

# Inspect or initialize configuration
talentflow config
talentflow config --init

# Check your environment for common issues
talentflow doctor
```

Run `talentflow --help` or `talentflow <command> --help` for the full flag
reference.

## Configuration

TalentFlow reads configuration from environment variables / a local `.env`
file — **never** from hardcoded values. Copy the example file to get started:

```bash
cp .env.example .env
```

| Variable                         | Description                                  | Default           |
| -------------------------------- | -------------------------------------------- | ----------------- |
| `AI_PROVIDER`                    | `anthropic` \| `openai` \| `openrouter`      | `anthropic`       |
| `MODEL`                          | Model name for the selected provider         | provider-specific |
| `TEMPERATURE`                    | Sampling temperature (0–1)                   | `0.3`             |
| `OPENAI_API_KEY`                 | API key for OpenAI                           | —                 |
| `ANTHROPIC_API_KEY`              | API key for Anthropic                        | —                 |
| `OPENROUTER_API_KEY`             | API key for OpenRouter                       | —                 |
| `TALENTFLOW_SKILLS_WEIGHT`       | Weight for skills match in the overall score | `0.5`             |
| `TALENTFLOW_EXPERIENCE_WEIGHT`   | Weight for experience match                  | `0.3`             |
| `TALENTFLOW_KEYWORD_WEIGHT`      | Weight for keyword overlap                   | `0.2`             |
| `TALENTFLOW_SHORTLIST_THRESHOLD` | Minimum score (%) to shortlist               | `75`              |
| `TALENTFLOW_REVIEW_THRESHOLD`    | Minimum score (%) for manual review          | `50`              |
| `TALENTFLOW_RESUMES_DIR`         | Default resumes folder                       | `resumes`         |
| `TALENTFLOW_JOBS_DIR`            | Default job descriptions folder              | `jobs`            |
| `TALENTFLOW_OUTPUT_DIR`          | Default output folder                        | `output`          |
| `TALENTFLOW_USE_AI`              | Globally enable/disable AI features          | `true`            |

No AI key configured? TalentFlow automatically falls back to keyword +
weighted scoring and template-based interview/email generation — every
feature still works, just without the semantic layer.

## AI providers

TalentFlow ships with an `AIProvider` abstraction so switching providers is a
one-line `.env` change:

```env
AI_PROVIDER=anthropic   # or: openai, openrouter
```

| Provider   | Env var              | Notes                              |
| ---------- | -------------------- | ---------------------------------- |
| Anthropic  | `ANTHROPIC_API_KEY`  | Default provider                   |
| OpenAI     | `OPENAI_API_KEY`     |                                    |
| OpenRouter | `OPENROUTER_API_KEY` | Access many models through one key |

Adding a new provider takes two files — see
[CONTRIBUTING.md](CONTRIBUTING.md#adding-a-new-ai-provider).

## Output formats

Every `talentflow screen` run writes to your output directory (default
`output/`):

```
output/
├── candidates.json      # full ranked candidate data
├── report.md             # executive summary, ranking table, skill gaps
├── report.json             # machine-readable report
├── report.csv                # spreadsheet-friendly ranking
├── interviews/*.md             # per-candidate interview kits (after `interview`)
└── emails/*.md                   # per-candidate email drafts (after `emails`)
```

Each report includes: candidate ranking, score breakdown (skills/experience/
keywords), an executive summary, skill gap analysis, and a hiring
recommendation.

## Roadmap

- [ ] First-party PDF resume plugin (`talentflow plugin add pdf`)
- [ ] Applicant Tracking System (ATS) export integrations
- [ ] Bulk email sending via SMTP/API connectors
- [ ] Configurable scoring rubrics per role template
- [ ] Multi-language resume parsing
- [ ] `talentflow watch` — auto-screen new resumes dropped into a folder

Have an idea? Open a
[feature request](.github/ISSUE_TEMPLATE/feature_request.md).

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for
the development workflow, architecture principles, and PR checklist. This
project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © SAYANJALI NEXUS PRIVATE LIMITED

## FAQ

**Does TalentFlow send my resumes to the cloud?**
Only if you configure an AI provider and don't pass `--no-ai`. Parsing,
scoring (keyword/weighted), and reporting all run 100% locally regardless.
Semantic scoring and AI-generated interview kits/emails send the relevant
resume/JD text to your configured provider's API.

**Can I use TalentFlow without an API key?**
Yes. Every feature has a non-AI fallback: keyword/weighted scoring instead of
semantic scoring, and template-based interview kits/emails instead of
AI-generated ones.

**Why doesn't it support PDF resumes out of the box?**
To stay dependency-light and Termux-compatible. See
[`docs/plugins.md`](docs/plugins.md) for the plugin pattern and how to add
PDF support yourself, or export resumes to `.txt`/`.md` first.

**Does this work on my Android phone?**
Yes — TalentFlow is built and tested to run inside
[Termux](https://termux.dev) with no native dependencies.

**How is the overall score calculated?**
A weighted blend of skills match, experience match, and keyword overlap
(weights configurable via `.env`). If AI scoring is enabled, the semantic
score is averaged in as well.
