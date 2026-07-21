# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-22

### Added

- Initial public release of TalentFlow CLI.
- Intelligent resume parser for `.txt` / `.md` resumes (name, email, phone,
  skills, experience, education, certifications, projects, keywords).
- AI resume matching engine with keyword, weighted, and semantic (AI-provider)
  scoring modes.
- Candidate ranking engine (Shortlisted / Review / Rejected) with configurable
  thresholds.
- AI interview generator producing technical, behavioural, culture-fit,
  resume-specific, and follow-up questions per shortlisted candidate.
- AI email generator with five templates (interview invitation, rejection,
  request more information, final round invitation, offer preparation) and
  four tone presets (formal, friendly, startup, corporate).
- Terminal dashboard with banner, progress bars, ranking table, and status
  badges.
- Interactive mode (`talentflow`) and direct commands (`parse`, `screen`,
  `interview`, `reports`, `emails`, `config`, `doctor`).
- AI provider abstraction layer supporting Anthropic, OpenAI, and OpenRouter.
- Markdown / JSON / CSV reporting with executive summary and skill gap
  analysis.
- Cross-platform support: Windows, Linux, macOS, and Android (Termux).
- Full test suite using Node's built-in test runner (no extra dependency).
- ESLint + Prettier developer tooling, GitHub Actions CI, issue/PR templates.

[1.0.0]: https://github.com/SHalimoosavi/talentflow-cli/releases/tag/v1.0.0
