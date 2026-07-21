# Contributing to TalentFlow CLI

Thanks for considering a contribution! TalentFlow CLI is built to stay
lightweight, cross-platform, and Termux-friendly — please keep that in mind
when proposing changes.

## Getting started

```bash
git clone https://github.com/SHalimoosavi/talentflow-cli.git
cd talentflow-cli
npm install
cp .env.example .env   # optional, only needed for AI features
npm test
npm run lint
```

Try the CLI locally with:

```bash
node bin/talentflow.js doctor
node bin/talentflow.js screen --jd jobs/backend.txt --resumes resumes/
```

Or link it globally for a real `talentflow` command during development:

```bash
npm link
talentflow doctor
```

## Project principles

1. **Stay dependency-light.** No `node-gyp`, no native compilation, no heavy
   PDF/binary libraries. If you need a new dependency, ask whether a Node.js
   built-in (`fs`, `path`, `crypto`, `fetch`, `readline`) can do the job first.
2. **Must run in Termux.** Every feature should work on Android via Termux
   with no platform-specific code paths.
3. **Clean architecture.** Business logic (`src/parser`, `src/scoring`,
   `src/ai`, `src/reports`, `src/templates`) stays separate from CLI/UX code
   (`src/cli`, `src/commands`). Commands orchestrate; they don't contain
   scoring or parsing logic themselves.
4. **No secrets in code.** Configuration only comes from environment
   variables / `.env`. Never hardcode API keys.

## Adding a new AI provider

Thanks to the provider abstraction, this is a two-file change:

1. Create `src/ai/YourProvider.js` extending `AIProvider` (see
   `src/ai/AnthropicProvider.js` for reference) and implement `complete()`.
2. Register it in `src/ai/providerFactory.js`'s `PROVIDERS` map.

That's it — every command that uses `createProvider()` picks it up
automatically.

## Adding a new command

1. Add the business logic to the relevant module under `src/`.
2. Create `src/commands/yourCommand.js` that wires that logic together and
   uses `src/utils/logger.js` for output.
3. Register the command in `src/cli/index.js` (both as a `program.command()`
   and, if useful, as an interactive-mode option).
4. Add tests under `tests/`.

## Commit style

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add OpenRouter provider
fix: correct experience scoring rounding
docs: clarify Termux installation steps
test: cover jdParser edge cases
chore: bump dependencies
```

## Versioning

TalentFlow CLI follows [Semantic Versioning](https://semver.org/). Breaking
CLI flag/command changes bump the major version.

## Before opening a PR

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] New behavior has test coverage
- [ ] README/CHANGELOG updated if user-facing behavior changed

## Reporting bugs / requesting features

Please use the issue templates under `.github/ISSUE_TEMPLATE/`. Include your
OS (Windows/Linux/macOS/Termux), Node.js version, and the exact command you
ran.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
