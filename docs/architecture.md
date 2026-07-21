# Architecture

TalentFlow CLI follows a clean-architecture-style separation between CLI/UX
code and business logic, so every module is independently testable and
reusable outside the CLI itself (see `index.js` for the public library API).

```
                        ┌─────────────────┐
                        │   bin/talentflow │  (executable entry point)
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   src/cli/index   │  commander wiring +
                        │                   │  interactive mode
                        └────────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
     ┌────────▼───────┐ ┌────────▼────────┐ ┌────────▼────────┐
     │ src/commands/*  │ │ src/cli/dashboard│ │ src/utils/logger│
     │ (orchestration) │ │ (terminal UI)     │ │ (console output)│
     └────────┬───────┘ └──────────────────┘ └─────────────────┘
              │
   ┌──────────┼───────────────────────────────┐
   │          │              │                 │
┌──▼───┐  ┌───▼────┐   ┌─────▼─────┐   ┌───────▼───────┐
│parser│  │ scoring │   │  reports  │   │   templates    │
│      │  │         │   │           │   │ (interview/    │
│resume│  │keyword  │   │  md/json/ │   │  email prompts) │
│jd    │  │weighted │   │  csv      │   └───────┬───────┘
└──────┘  │semantic │   └───────────┘           │
          │ranking  │                    ┌───────▼───────┐
          └────┬────┘                    │      ai        │
               │                         │  AIProvider     │
               └─────────────────────────►  Anthropic/     │
                                         │  OpenAI/        │
                                         │  OpenRouter      │
                                         └─────────────────┘
```

## Layers

- **`bin/`** — the executable. Only responsible for invoking the CLI and
  catching fatal errors.
- **`src/cli/`** — command wiring (Commander.js) and terminal UI
  (dashboard, banner, tables, progress bars). No business logic lives here.
- **`src/commands/`** — one file per `talentflow <command>`. Each command
  orchestrates parser/scoring/reports/ai modules and prints results through
  `src/utils/logger.js`. Every command is also exported from `index.js` so it
  can be called programmatically.
- **`src/parser/`** — turns raw resume/JD text into normalized JSON
  (`resumeParser.js`, `jdParser.js`). Pure functions, no I/O side effects
  besides reading the input file.
- **`src/scoring/`** — keyword, weighted, and semantic (AI) scoring, plus the
  ranking/classification engine. Pure functions operating on parsed objects —
  fully unit-testable without any file or network I/O.
- **`src/ai/`** — the provider abstraction. `AIProvider` is the contract;
  `AnthropicProvider` / `OpenAIProvider` / `OpenRouterProvider` implement it;
  `providerFactory.js` is the single switch point driven by `AI_PROVIDER`.
- **`src/reports/`** — renders ranked candidates into Markdown/JSON/CSV.
- **`src/templates/`** — prompt builders and fallback (non-AI) templates for
  interview kits and recruiter emails.
- **`src/config/`** — loads `.env` + defaults into a single config object
  used throughout the app.
- **`src/utils/`** — filesystem, text-processing, and logging helpers shared
  across layers.

## Data flow (`talentflow screen`)

1. `jdParser.parseJobDescription()` reads the JD file → structured object.
2. `resumeParser.parseResumeDirectory()` reads every resume in the folder →
   array of structured objects.
3. For each resume: `weightedScorer.scoreWeighted()` always runs (keyword +
   skills + experience). If an AI provider is configured and has a valid API
   key, `semanticScorer.scoreSemantic()` also runs and is blended in.
4. `rankingEngine.rankCandidates()` sorts and classifies candidates into
   Shortlisted / Review / Rejected using configurable thresholds.
5. `reportGenerator.writeReports()` writes `report.md` / `report.json` /
   `report.csv`, and `candidates.json` is written for downstream commands
   (`interview`, `emails`, `reports`) to consume.
6. `src/cli/dashboard.js` renders the ranking table and summary stats to the
   terminal.

## Design principles

- **Dependency-light.** Every dependency is pure JavaScript — no
  `node-gyp`, no native builds — so the toolkit runs unmodified in Android
  Termux.
- **AI is additive, never required.** Every AI-backed feature has a
  deterministic fallback so the tool is fully usable offline / without an
  API key.
- **Small, composable modules.** No file mixes CLI/UX concerns with scoring
  or parsing logic, which is what makes the test suite exercise business
  logic directly without spinning up the CLI.
